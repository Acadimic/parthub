import { CourseService } from '@modules/course/course.service';
import { EnrollmentService } from '@modules/enrollment/enrollment.service';
import { MaterialService } from '@modules/material/material.service';
import { OrderService } from '@modules/order/order.service';
import { QuestionService } from '@modules/question/question.service';
import { TestPaperService } from '@modules/test-paper/test-paper.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, OrderStatus, TicketCategory, TicketReason } from '@repo/shared/enums';
import { TICKET_LIMITS } from '@repo/shared/utils';
import { TicketDto } from '@repo/shared/validations';
import { Types } from 'mongoose';

const DAY_MS = 24 * 60 * 60 * 1000;

/** What a ticket points at, decided server side from the ids the learner sent. */
export interface ITicketTarget {
  ownerOrg: Types.ObjectId | null;
  course: string | null;
  courseModule: string | null;
  material: string | null;
  testPaper: string | null;
  question: string | null;
  enrollment: string | null;
  order: string | null;
  targetName: string;
  courseName: string;
}

const NO_TARGET: ITicketTarget = {
  ownerOrg: null,
  course: null,
  courseModule: null,
  material: null,
  testPaper: null,
  question: null,
  enrollment: null,
  order: null,
  targetName: '',
  courseName: '',
};

/**
 * Turns the ids a learner sent with a report into what the ticket is about: checks they may see it,
 * that the pieces belong together, and which organization owns it. Nothing here trusts the client.
 */
@Injectable()
export class TicketTargetService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    private readonly courseService: CourseService,
    private readonly enrollmentService: EnrollmentService,
    private readonly orderService: OrderService,
    private readonly materialService: MaterialService,
    private readonly testPaperService: TestPaperService,
    private readonly questionService: QuestionService,
  ) {}

  async resolve(org: Types.ObjectId, userId: Types.ObjectId, payload: TicketDto): Promise<ITicketTarget> {
    switch (payload.category) {
      case TicketCategory.QUESTION:
        return this.resolveQuestionTarget(org, userId, payload);
      case TicketCategory.CONTENT:
        return this.resolveContentTarget(org, userId, payload);
      // A doubt about one question carries the question; one about a lesson or paper, the lesson.
      case TicketCategory.DOUBT:
        return payload.question
          ? this.resolveQuestionTarget(org, userId, payload)
          : this.resolveContentTarget(org, userId, payload);
      case TicketCategory.PAYMENT:
        return this.resolvePaymentTarget(userId, payload);
      case TicketCategory.GENERAL:
      case TicketCategory.CONTACT:
        return NO_TARGET;
    }
  }

  /** The course the learner may open, or a 404/403: only content they can see may be reported. */
  private async getOpenCourse(org: Types.ObjectId, userId: Types.ObjectId, courseId: string | null | undefined) {
    if (!courseId) throw new BadRequestException('Say which course this is about.');
    const course = await this.courseService.getVisibleCourse(org, courseId);
    if (!course) throw new NotFoundException('Course not found.');
    if (!(await this.enrollmentService.hasAccess(userId, course))) {
      throw new ForbiddenException('Enrol in this course to report its content.');
    }
    return course;
  }

  private async resolveQuestionTarget(org: Types.ObjectId, userId: Types.ObjectId, payload: TicketDto) {
    const course = await this.getOpenCourse(org, userId, payload.course);
    if (!payload.testPaper || !payload.question) throw new BadRequestException('Say which question this is about.');
    // The paper must sit in this course: the course is what the learner may open, not the org's drafts.
    const [courseModule, testPaper, question] = await Promise.all([
      this.courseService.findModuleHolding(String(course._id), { testPaper: payload.testPaper }),
      this.testPaperService.getOrgTestPaperById(course.org, payload.testPaper),
      this.questionService.findById(course.org, payload.question),
    ]);
    if (!courseModule || !testPaper || !question || !(testPaper.sections ?? []).includes(question.section)) {
      throw new NotFoundException('Question not found.');
    }
    return {
      ...NO_TARGET,
      ownerOrg: course.org,
      course: String(course._id),
      courseModule: String(courseModule._id),
      testPaper: testPaper._id,
      question: question._id,
      targetName: testPaper.name,
      courseName: course.name,
    };
  }

  private async resolveContentTarget(org: Types.ObjectId, userId: Types.ObjectId, payload: TicketDto) {
    const course = await this.getOpenCourse(org, userId, payload.course);
    const base = {
      ...NO_TARGET,
      ownerOrg: course.org,
      course: String(course._id),
      courseName: course.name,
    };
    // The module is the one that holds the item in this course, never the id the client sent.
    if (payload.material) {
      const [courseModule, material] = await Promise.all([
        this.courseService.findModuleHolding(String(course._id), { material: payload.material }),
        this.materialService.findById(course.org, payload.material),
      ]);
      if (!courseModule || !material) throw new NotFoundException('Lesson not found.');
      return { ...base, courseModule: String(courseModule._id), material: material._id, targetName: material.name };
    }
    if (payload.testPaper) {
      const [courseModule, testPaper] = await Promise.all([
        this.courseService.findModuleHolding(String(course._id), { testPaper: payload.testPaper }),
        this.testPaperService.getOrgTestPaperById(course.org, payload.testPaper),
      ]);
      if (!courseModule || !testPaper) throw new NotFoundException('Test paper not found.');
      return { ...base, courseModule: String(courseModule._id), testPaper: testPaper._id, targetName: testPaper.name };
    }
    return { ...base, targetName: course.name };
  }

  private async resolvePaymentTarget(userId: Types.ObjectId, payload: TicketDto): Promise<ITicketTarget> {
    if (payload.order) {
      const order = await this.orderService.findForBuyer(userId, payload.order);
      if (!order) throw new NotFoundException('Order not found.');
      if (payload.reason === TicketReason.REFUND_REQUEST) {
        this.assertRefundable(order.status === OrderStatus.PAID ? order.paidAt : null);
      }
      return {
        ...NO_TARGET,
        ownerOrg: new Types.ObjectId(String(order.org)),
        order: String(order._id),
        targetName: order.snapshot.planName,
        courseName: order.snapshot.courses.map((course) => course.name).join(', '),
      };
    }
    if (payload.enrollment) {
      const enrollment = await this.enrollmentService.findForLearner(userId, payload.enrollment);
      if (!enrollment) throw new NotFoundException('Purchase not found.');
      // A seat an order granted was paid for through that order, which is what a refund acts on.
      if (enrollment.order) {
        return this.resolvePaymentTarget(userId, { ...payload, order: String(enrollment.order), enrollment: null });
      }
      if (payload.reason === TicketReason.REFUND_REQUEST) {
        const isPaid = enrollment.amount > 0 && enrollment.status === EnrollmentStatus.ACTIVE;
        this.assertRefundable(isPaid ? enrollment.startsAt : null);
      }
      const courseName = await this.courseService.getCourseName(String(enrollment.course));
      return {
        ...NO_TARGET,
        ownerOrg: new Types.ObjectId(String(enrollment.providerOrg)),
        course: String(enrollment.course),
        enrollment: String(enrollment._id),
        targetName: courseName,
        courseName,
      };
    }
    throw new BadRequestException('Say which purchase this is about.');
  }

  /** The 7-day refund window from the terms; past it, "Something else" still reaches support. */
  private assertRefundable(paidAt: Date | null): void {
    if (!paidAt) throw new BadRequestException('Only a completed payment can be refunded.');
    if (Date.now() - paidAt.getTime() > TICKET_LIMITS.REFUND_WINDOW_DAYS * DAY_MS) {
      throw new BadRequestException(
        `Refunds can be requested within ${TICKET_LIMITS.REFUND_WINDOW_DAYS} days of payment. Choose "Something else" to write to support.`,
      );
    }
  }
}
