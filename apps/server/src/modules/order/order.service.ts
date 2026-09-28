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
import { EnrollmentService } from '@modules/enrollment/enrollment.service';
import { MeetService } from '@modules/meet/meet.service';
import { OrgService } from '@modules/org/org.service';
import { PlanService } from '@modules/plan/plan.service';
import { RazorpayService } from '@modules/razorpay/razorpay.service';
import { CurrencyType, OrderStatus } from '@repo/shared/enums';
import { IOrderCheckout, IOrderSnapshot } from '@repo/shared/interfaces';
import { CreateOrderDto, OrderDto, PlanDto, VerifyOrderPaymentDto } from '@repo/shared/validations';
import { randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { CouponService } from './coupon.service';
import { Order, OrderDocument } from './order.schema';

/** The link token: 12 characters from an alphabet with no look-alikes, so it survives being read aloud. */
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 12;

const makeCode = () => {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
};

@Injectable()
export class OrderService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private readonly planService: PlanService,
    private readonly couponService: CouponService,
    private readonly enrollmentService: EnrollmentService,
    private readonly meetService: MeetService,
    private readonly orgService: OrgService,
    private readonly razorpayService: RazorpayService,
  ) {}

  getTransformed(row: OrderDocument): OrderDto {
    return {
      ...getTransformedBaseFields(row),
      code: row.code,
      plan: String(row.plan),
      snapshot: row.snapshot,
      coupon: row.coupon ?? undefined,
      subtotal: row.subtotal,
      discount: row.discount,
      total: row.total,
      currency: row.currency,
      status: this.getEffectiveStatus(row),
      note: row.note,
      expiresAt: row.expiresAt?.toISOString(),
      purchasedBy: row.purchasedBy ? String(row.purchasedBy) : undefined,
      paidAt: row.paidAt?.toISOString(),
      razorpayOrderId: row.razorpayOrderId,
      razorpayPaymentId: row.razorpayPaymentId,
    };
  }

  /** An open order past its expiry reads as expired without a job having to sweep it. */
  private getEffectiveStatus(row: OrderDocument): OrderStatus {
    if (row.status === OrderStatus.OPEN && row.expiresAt && row.expiresAt < new Date()) return OrderStatus.EXPIRED;
    return row.status;
  }

  /**
   * Makes an order from a plan, copying everything the buyer will get into the snapshot. From here
   * on the plan is only a reference for the teacher's records.
   */
  async create(org: Types.ObjectId, payload: CreateOrderDto): Promise<OrderDto> {
    const plan = await this.planService.getPlanById(payload.plan);
    if (plan?.org !== String(org) || plan._deleted) throw new NotFoundException('Plan not found.');
    const snapshot = await this.buildSnapshot(org, plan);
    const subtotal = plan.amount;
    let coupon: OrderDocument['coupon'] | undefined;
    let discount = 0;
    if (payload.coupon) {
      const row = await this.couponService.resolve(org, payload.coupon, plan._id);
      discount = this.couponService.getDiscount(row, subtotal);
      coupon = this.couponService.toOrderCoupon(row, discount);
    }
    const _id = new Types.ObjectId();
    const row = await this.orderModel
      .findOneAndUpdate(
        { _id },
        {
          $set: {
            code: makeCode(),
            plan: plan._id,
            snapshot,
            coupon,
            subtotal,
            discount,
            total: Math.max(0, subtotal - discount),
            currency: plan.currency ?? CurrencyType.INR,
            status: OrderStatus.OPEN,
            note: payload.note,
            expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
          },
          $setOnInsert: { _id },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<OrderDocument>();
    if (!row) throw new BadRequestException('Order could not be created.');
    return this.getTransformed(row);
  }

  private async buildSnapshot(org: Types.ObjectId, plan: PlanDto): Promise<IOrderSnapshot> {
    const [courses, meets, orgRow] = await Promise.all([
      this.courseModel
        .find({ _id: { $in: plan.courses ?? [] }, _deleted: { $ne: true } }, { name: 1 })
        .lean<{ _id: Types.ObjectId; name: string }[]>(),
      this.meetService.getMeetsByIds(plan.meets ?? []),
      this.orgService.getOrgById(String(org)),
    ]);
    return {
      planId: plan._id,
      planName: plan.name,
      planDescription: plan.description ?? '',
      amount: plan.amount,
      realAmount: plan.realAmount ?? plan.amount,
      currency: plan.currency ?? CurrencyType.INR,
      period: plan.period ?? '',
      interval: plan.interval ?? 1,
      courses: courses.map((course) => ({ _id: String(course._id), name: course.name })),
      meets: meets.map((meet) => ({
        _id: String(meet._id),
        title: meet.title,
        startTime: meet.startTime ? new Date(meet.startTime).toISOString() : '',
      })),
      orgName: orgRow?.name ?? '',
    };
  }

  /** The teacher's orders, newest first. */
  async getByOrg(org: Types.ObjectId): Promise<OrderDto[]> {
    const rows = await this.orderModel
      .find({ org, _deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean<OrderDocument[]>();
    return rows.map((row) => this.getTransformed(row));
  }

  /** The orders a learner has paid for. */
  async getByBuyer(userId: Types.ObjectId): Promise<OrderDto[]> {
    const rows = await this.orderModel
      .find({ purchasedBy: String(userId), _deleted: { $ne: true } })
      .sort({ paidAt: -1 })
      .lean<OrderDocument[]>();
    return rows.map((row) => this.getTransformed(row));
  }

  /** What the link shows anyone who opens it. Payment ids stay server-side. */
  async getByCode(code: string): Promise<OrderDto> {
    const row = await this.orderModel.findOne({ code, _deleted: { $ne: true } }).lean<OrderDocument>();
    if (!row) throw new NotFoundException('This order link is not valid.');
    const dto = this.getTransformed(row);
    return { ...dto, razorpayOrderId: undefined, razorpayPaymentId: undefined };
  }

  /** An order that can still be bought, or the reason it cannot. */
  private async getOpen(code: string): Promise<OrderDocument> {
    const row = await this.orderModel.findOne({ code, _deleted: { $ne: true } }).lean<OrderDocument>();
    if (!row) throw new NotFoundException('This order link is not valid.');
    const status = this.getEffectiveStatus(row);
    if (status === OrderStatus.PAID) throw new ConflictException('This order has already been paid.');
    if (status === OrderStatus.EXPIRED) throw new ConflictException('This order link has expired.');
    if (status === OrderStatus.CANCELLED) throw new ConflictException('This order was cancelled.');
    return row;
  }

  async applyCoupon(code: string, couponCode: string): Promise<OrderDto> {
    const row = await this.getOpen(code);
    const coupon = await this.couponService.resolve(row.org, couponCode, row.snapshot.planId);
    const discount = this.couponService.getDiscount(coupon, row.subtotal);
    const updated = await this.orderModel
      .findByIdAndUpdate(
        row._id,
        {
          $set: {
            coupon: this.couponService.toOrderCoupon(coupon, discount),
            discount,
            total: row.subtotal - discount,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<OrderDocument>();
    if (!updated) throw new NotFoundException('This order link is not valid.');
    return this.getTransformed(updated);
  }

  async removeCoupon(code: string): Promise<OrderDto> {
    const row = await this.getOpen(code);
    const updated = await this.orderModel
      .findByIdAndUpdate(
        row._id,
        { $set: { discount: 0, total: row.subtotal }, $unset: { coupon: 1 } },
        { returnDocument: 'after' },
      )
      .lean<OrderDocument>();
    if (!updated) throw new NotFoundException('This order link is not valid.');
    return this.getTransformed(updated);
  }

  /**
   * The buyer takes the order: nothing owed means the seats are granted at once; otherwise a
   * Razorpay order is made to collect the total and the seats wait on `verifyPayment`.
   */
  async checkout(userId: Types.ObjectId, code: string): Promise<IOrderCheckout<OrderDto>> {
    const row = await this.getOpen(code);
    if (row.total === 0) {
      const paid = await this.fulfil(row, userId, undefined);
      return { order: this.getTransformed(paid), payment: null, keyId: '' };
    }
    if (!this.razorpayService.isConfigured()) {
      throw new ServiceUnavailableException('Payments are not set up yet. Please try again later.');
    }
    const payment = await this.razorpayService.createOrder({
      amount: row.total,
      currency: row.currency,
      receipt: String(row._id),
    });
    await this.orderModel.updateOne({ _id: row._id }, { $set: { razorpayOrderId: payment.id } });
    return {
      order: this.getTransformed({ ...row, razorpayOrderId: payment.id } as OrderDocument),
      payment: { id: payment.id, amount: Number(payment.amount), currency: payment.currency },
      keyId: this.razorpayService.getKeyId(),
    };
  }

  async verifyPayment(userId: Types.ObjectId, code: string, payload: VerifyOrderPaymentDto): Promise<OrderDto> {
    const row = await this.orderModel.findOne({ code, _deleted: { $ne: true } }).lean<OrderDocument>();
    if (!row) throw new NotFoundException('This order link is not valid.');
    if (row.status === OrderStatus.PAID) return this.getTransformed(row);
    if (row.razorpayOrderId !== payload.razorpayOrderId) throw new ConflictException('Order does not match.');
    const isValid = this.razorpayService.verifyPayment(
      payload.razorpayOrderId,
      payload.razorpayPaymentId,
      payload.razorpaySignature,
    );
    if (!isValid) throw new BadRequestException('Payment could not be verified.');
    const paid = await this.fulfil(row, userId, payload.razorpayPaymentId);
    return this.getTransformed(paid);
  }

  /**
   * Grants what the snapshot promises — a seat in each course and a place in each live class —
   * and closes the order on the buyer. Runs as the buyer: the seats are theirs, and carry the
   * selling organization in `providerOrg`. The class and coupon updates name that organization
   * outright, and the plugin never restamps `org` on an update.
   */
  private async fulfil(row: OrderDocument, userId: Types.ObjectId, paymentId: string | undefined) {
    const term = this.enrollmentService.getTermFor(row.snapshot.period, row.snapshot.interval, new Date());
    for (const course of row.snapshot.courses) {
      await this.enrollmentService.grant(userId, {
        course: course._id,
        providerOrg: String(row.org),
        plan: row.snapshot.planId,
        order: String(row._id),
        amount: row.total,
        currency: row.currency,
        ...term,
      });
    }
    await Promise.all(
      row.snapshot.meets.map((meet) => this.meetService.addAttendees(row.org, meet._id, [String(userId)])),
    );
    if (row.coupon) await this.couponService.markUsed(row.coupon.code, row.org);
    const paid = await this.orderModel
      .findByIdAndUpdate(
        row._id,
        {
          $set: {
            status: OrderStatus.PAID,
            purchasedBy: String(userId),
            paidAt: new Date(),
            razorpayPaymentId: paymentId,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<OrderDocument>();
    if (!paid) throw new NotFoundException('This order link is not valid.');
    return paid;
  }
}
