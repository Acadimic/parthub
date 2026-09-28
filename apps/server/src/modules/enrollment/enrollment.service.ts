import { getTransformedBaseFields } from '@database/base.transform';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Course, CourseDocument } from '@modules/course/course.schema';
import { PlanService } from '@modules/plan/plan.service';
import { RazorpayService } from '@modules/razorpay/razorpay.service';
import { CurrencyType, EnrollmentStatus, PeriodType } from '@repo/shared/enums';
import { IEnrollmentCheckout } from '@repo/shared/interfaces';
import { EnrollCourseDto, EnrollmentDto, PlanDto, VerifyEnrollmentPaymentDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './enrollment.schema';

/** How long one interval of each period lasts, in days. */
const PERIOD_DAYS: Record<PeriodType, number> = {
  [PeriodType.DAILY]: 1,
  [PeriodType.WEEKLY]: 7,
  [PeriodType.MONTHLY]: 30,
  [PeriodType.YEARLY]: 365,
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EnrollmentService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.

  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private readonly planService: PlanService,
    private readonly razorpayService: RazorpayService,
  ) {}

  getTransformed(row: EnrollmentDocument): EnrollmentDto {
    return {
      ...getTransformedBaseFields(row),
      course: String(row.course),
      providerOrg: String(row.providerOrg),
      plan: String(row.plan),
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
    };
  }

  /** Every seat the learner has held, newest first, so the client can show history as well as access. */
  async getByUser(userId: Types.ObjectId): Promise<EnrollmentDto[]> {
    const rows = await this.enrollmentModel
      .find({ createdBy: userId, _deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean<EnrollmentDocument[]>();
    return rows.map((row) => this.getTransformed(row));
  }

  /** The seat that grants access right now, or null. A term that has run out does not count. */
  async getActive(userId: Types.ObjectId, courseId: string): Promise<EnrollmentDocument | null> {
    return this.enrollmentModel
      .findOne({
        createdBy: userId,
        course: courseId,
        status: EnrollmentStatus.ACTIVE,
        _deleted: { $ne: true },
        endsAt: { $gt: new Date() },
      })
      .lean<EnrollmentDocument>();
  }

  /**
   * Whether the course asks for a seat at all. A course is paid when any of its plans carries a
   * price; one with no plans, or only free plans, is open to every learner who can see it.
   */
  async isPaidCourse(course: CourseDocument): Promise<boolean> {
    const plans = await this.planService.getPlansByCourseId(course.org, String(course._id));
    return plans.some((plan) => plan.amount > 0);
  }

  /** True when the learner may open the course's contents: it is free, or they hold an active seat. */
  async hasAccess(userId: Types.ObjectId, course: CourseDocument): Promise<boolean> {
    if (!(await this.isPaidCourse(course))) return true;
    return Boolean(await this.getActive(userId, String(course._id)));
  }

  /**
   * Starts a seat. A free plan (or a course with none) is active at once; a priced one is pending
   * and comes back with the Razorpay order the checkout collects on. An active seat that already
   * exists is returned rather than duplicated.
   */
  async checkout(
    org: Types.ObjectId,
    userId: Types.ObjectId,
    payload: EnrollCourseDto,
  ): Promise<IEnrollmentCheckout<EnrollmentDto>> {
    const course = await this.courseModel
      .findOne({ _id: payload.course, _deleted: { $ne: true }, $or: [{ isPublished: true }, { org }] })
      .lean<CourseDocument>();
    if (!course) throw new NotFoundException('Course not found.');

    const existing = await this.getActive(userId, payload.course);
    if (existing) return { enrollment: this.getTransformed(existing), order: null, keyId: '' };

    const plans = await this.planService.getPlansByCourseId(course.org, payload.course);
    const plan = this.pickPlan(plans, payload.plan);
    const amount = plan.amount;
    const currency = plan.currency ?? CurrencyType.INR;

    const providerOrg = String(course.org);
    if (amount === 0) {
      const row = await this.insert({
        course: payload.course,
        providerOrg,
        plan: plan._id,
        status: EnrollmentStatus.ACTIVE,
        amount: 0,
        currency,
        ...this.getTerm(plan, new Date()),
      });
      return { enrollment: this.getTransformed(row), order: null, keyId: '' };
    }

    if (!this.razorpayService.isConfigured()) {
      throw new ServiceUnavailableException('Payments are not set up yet. Please try again later.');
    }
    // A pending seat from an abandoned checkout is reused, so the learner never holds two.
    const pending = await this.enrollmentModel
      .findOne({
        createdBy: userId,
        course: payload.course,
        status: EnrollmentStatus.PENDING,
        _deleted: { $ne: true },
      })
      .lean<EnrollmentDocument>();
    const row = pending
      ? await this.enrollmentModel
          .findByIdAndUpdate(pending._id, { $set: { plan: plan._id, amount, currency } }, { returnDocument: 'after' })
          .lean<EnrollmentDocument>()
      : await this.insert({
          course: payload.course,
          providerOrg,
          plan: plan._id,
          amount,
          currency,
          // Provisional: the term is reset from the moment the payment lands.
          ...this.getTerm(plan, new Date()),
        });
    if (!row) throw new NotFoundException('Enrollment could not be started.');

    const order = await this.razorpayService.createOrder({ amount, currency, receipt: String(row._id) });
    await this.enrollmentModel.updateOne({ _id: row._id }, { $set: { razorpayOrderId: order.id } });
    return {
      enrollment: this.getTransformed({ ...row, razorpayOrderId: order.id } as EnrollmentDocument),
      order: { id: order.id, amount: Number(order.amount), currency: order.currency },
      keyId: this.razorpayService.getKeyId(),
    };
  }

  /**
   * Settles a pending seat with what Razorpay's checkout handed back. The signature proves the
   * payment belongs to the order we created, so nothing is trusted from the client alone.
   */
  async verifyPayment(userId: Types.ObjectId, payload: VerifyEnrollmentPaymentDto): Promise<EnrollmentDto> {
    const row = await this.enrollmentModel
      .findOne({ _id: payload.enrollment, createdBy: userId, _deleted: { $ne: true } })
      .lean<EnrollmentDocument>();
    if (!row) throw new NotFoundException('Enrollment not found.');
    if (row.status === EnrollmentStatus.ACTIVE) return this.getTransformed(row);
    if (row.razorpayOrderId !== payload.razorpayOrderId) throw new ConflictException('Order does not match.');
    const isValid = this.razorpayService.verifyPayment(
      payload.razorpayOrderId,
      payload.razorpayPaymentId,
      payload.razorpaySignature,
    );
    if (!isValid) throw new BadRequestException('Payment could not be verified.');

    // The plan may have been edited or removed since the checkout began; the seat keeps the term
    // it was sold on, so its stored period is what the fresh term is cut from.
    const plan = await this.planService.getPlanById(String(row.plan));
    if (!plan) throw new NotFoundException('The plan this seat was started on no longer exists.');
    const updated = await this.enrollmentModel
      .findByIdAndUpdate(
        row._id,
        {
          $set: {
            status: EnrollmentStatus.ACTIVE,
            razorpayPaymentId: payload.razorpayPaymentId,
            ...this.getTerm(plan, new Date()),
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EnrollmentDocument>();
    if (!updated) throw new NotFoundException('Enrollment not found.');
    return this.getTransformed(updated);
  }

  /**
   * Inserts a row as an upsert on a fresh id, the way every other service writes. The
   * change-tracking plugin seeds `org` and `createdBy` on that path through `$setOnInsert`; on a
   * plain `create` they are required fields that validation checks before the save hook sets them.
   */
  private async insert(fields: Partial<Enrollment>): Promise<EnrollmentDocument> {
    const _id = new Types.ObjectId();
    const row = await this.enrollmentModel
      .findOneAndUpdate(
        { _id },
        { $set: fields, $setOnInsert: { _id } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<EnrollmentDocument>();
    if (!row) throw new NotFoundException('Enrollment could not be started.');
    return row;
  }

  /**
   * A seat granted by something other than the course page's own checkout — a paid order, for
   * one. Runs in the learner's context; `providerOrg` says which organization provides it.
   */
  async grant(
    userId: Types.ObjectId,
    fields: Pick<Enrollment, 'course' | 'providerOrg' | 'plan' | 'amount' | 'currency'> & {
      order: string;
      startsAt: Date;
      endsAt: Date;
    },
  ): Promise<EnrollmentDocument> {
    const existing = await this.getActive(userId, fields.course);
    if (existing) return existing;
    return this.insert({ ...fields, status: EnrollmentStatus.ACTIVE });
  }

  /** When a seat runs, for a period named by string — an order snapshot rather than a plan. */
  getTermFor(period: string, interval: number, startsAt: Date): { startsAt: Date; endsAt: Date } {
    const days = PERIOD_DAYS[period as PeriodType];
    if (!days) throw new BadRequestException('This plan has no term, so a seat cannot be started on it.');
    return { startsAt, endsAt: new Date(startsAt.getTime() + days * (interval || 1) * DAY_MS) };
  }

  /** The plan the learner asked for, or the cheapest when they did not. */
  private pickPlan(plans: PlanDto[], planId: string | undefined): PlanDto {
    if (!plans.length) throw new BadRequestException('This course has no plan to enrol on yet.');
    if (planId) {
      const plan = plans.find((row) => row._id === planId);
      if (!plan) throw new BadRequestException('That plan is not offered on this course.');
      return plan;
    }
    return [...plans].sort((a, b) => a.amount - b.amount)[0];
  }

  /** When a seat runs, from a plan's period and interval. */
  private getTerm(plan: PlanDto, startsAt: Date): { startsAt: Date; endsAt: Date } {
    return this.getTermFor(plan.period ?? '', plan.interval ?? 1, startsAt);
  }
}
