import { getTransformedBaseFields } from '@database/base.transform';
import { EnrollmentService } from '@modules/enrollment/enrollment.service';
import { OrderService } from '@modules/order/order.service';
import { S3Service } from '@modules/s3/s3.service';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TicketCategory, TicketInboxStatus, TicketStatus } from '@repo/shared/enums';
import { type ITicketInbox } from '@repo/shared/interfaces';
import {
  ACTIVE_TICKET_STATUSES,
  COURSE_TICKET_CATEGORIES,
  DISCUSSION_FILE_EXTENSIONS,
  TICKET_LIMITS,
  TICKET_REASONS,
  isActiveTicket,
  isCourseTicket,
} from '@repo/shared/utils';
import {
  AttachmentDto,
  RecordRefundDto,
  TicketDto,
  TicketInboxQueryDto,
  TicketReplyDto,
} from '@repo/shared/validations';
import { randomBytes } from 'node:crypto';
import { Model, QueryFilter, Types } from 'mongoose';
import { TicketMailService } from './ticket-mail.service';
import { type ITicketTarget, TicketTargetService } from './ticket-target.service';
import { Ticket, TicketDocument, type TicketMessage } from './ticket.schema';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

const makeCode = () => {
  const bytes = randomBytes(CODE_LENGTH);
  return `T-${Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')}`;
};

/** A reply as it is pushed: the schema's message, with the attachments as the client sent them. */
type TicketMessageInput = Omit<TicketMessage, 'attachments'> & { attachments: AttachmentDto[] };

/** Who is acting on a ticket: its reporter, the course's staff, or platform staff. */
type TicketActor =
  { kind: 'reporter'; userId: Types.ObjectId } | { kind: 'owner'; org: Types.ObjectId } | { kind: 'platform' };

/**
 * Reported issues. A ticket is the reporter's row but is read and answered across organizations — by
 * the course's organization (`ownerOrg`) or by platform staff — so writes go by `_id` plus the check
 * that the caller is one of those, rather than by the caller's `org`.
 */
@Injectable()
export class TicketService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private readonly ticketTargetService: TicketTargetService,
    private readonly enrollmentService: EnrollmentService,
    private readonly orderService: OrderService,
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
    private readonly ticketMailService: TicketMailService,
  ) {}

  // ---- Reporter ----

  /**
   * Raises a ticket. Reporting the same question, lesson or purchase again while a ticket on it is
   * still open adds the new text to that ticket instead of opening a second one.
   */
  async create(org: Types.ObjectId, userId: Types.ObjectId, payload: TicketDto): Promise<TicketDto> {
    if (!TICKET_REASONS[payload.category].includes(payload.reason)) {
      throw new BadRequestException('That reason does not fit this kind of report.');
    }
    this.assertAttachments(payload.attachments, org);
    const target = await this.ticketTargetService.resolve(org, userId, payload);
    const body = payload.body.trim();
    const existing = await this.findOpenDuplicate(userId, payload.category, target);
    if (existing) {
      const row = await this.pushMessage(existing._id, this.buildMessage(userId, body, payload.attachments, false), {});
      return this.getTransformed(row);
    }
    const today = await this.ticketModel.countDocuments({
      createdBy: userId,
      createdAt: { $gte: new Date(Date.now() - DAY_MS) },
      _deleted: { $ne: true },
    });
    if (today >= TICKET_LIMITS.MAX_PER_DAY) {
      throw new BadRequestException('You have raised a lot of reports today. Please try again tomorrow.');
    }
    const row = await this.ticketModel
      .findOneAndUpdate(
        { _id: payload._id, createdBy: userId },
        {
          $setOnInsert: {
            ...target,
            code: makeCode(),
            category: payload.category,
            reason: payload.reason,
            status: TicketStatus.OPEN,
            body,
            attachments: payload.attachments,
            pageUrl: payload.pageUrl ?? '',
            messages: [],
            _deleted: false,
          },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<TicketDocument>();
    if (!row) throw new NotFoundException('The report could not be saved.');
    if (row.category === TicketCategory.PAYMENT) this.ticketMailService.notifyPlatformOfPayment(row);
    return this.getTransformed(row);
  }

  /** The reporter's tickets, newest first, without their threads. */
  async getMine(userId: Types.ObjectId): Promise<TicketDto[]> {
    const rows = await this.ticketModel
      .find({ createdBy: userId, _deleted: { $ne: true } }, { messages: 0 })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<TicketDocument[]>();
    return rows.map((row) => this.getTransformed(row));
  }

  /** One of the reporter's tickets with its thread; opening it marks staff replies as seen. */
  async getMineById(userId: Types.ObjectId, id: string): Promise<TicketDto> {
    const row = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, createdBy: userId, _deleted: { $ne: true } },
        { $set: { reporterSeenAt: new Date() } },
        // A read, as far as the audit trail is concerned: no activity row for every open.
        { returnDocument: 'after', timestamps: false, skipActivityLog: true },
      )
      .lean<TicketDocument>();
    if (!row) throw new NotFoundException('Report not found.');
    return this.getTransformed(row);
  }

  /** How many of the reporter's tickets have a staff reply they have not opened yet. */
  async getUnreadCount(userId: Types.ObjectId): Promise<number> {
    return this.ticketModel.countDocuments({
      createdBy: userId,
      _deleted: { $ne: true },
      lastStaffReplyAt: { $ne: null },
      $expr: { $gt: ['$lastStaffReplyAt', { $ifNull: ['$reporterSeenAt', new Date(0)] }] },
    });
  }

  /** The reporter answers. A ticket closed recently reopens; one closed long ago asks for a new report. */
  async replyAsReporter(
    org: Types.ObjectId,
    userId: Types.ObjectId,
    id: string,
    payload: TicketReplyDto,
  ): Promise<TicketDto> {
    this.assertAttachments(payload.attachments, org);
    const ticket = await this.getTicket({ kind: 'reporter', userId }, id);
    const changes: Partial<Ticket> = { reporterSeenAt: new Date() };
    if (!isActiveTicket(ticket.status)) {
      const closedAt = ticket.resolvedAt?.getTime() ?? 0;
      if (Date.now() - closedAt > TICKET_LIMITS.REOPEN_WINDOW_DAYS * DAY_MS) {
        throw new BadRequestException('This report was closed a while ago. Please raise a new one.');
      }
      Object.assign(changes, { status: TicketStatus.OPEN, resolvedAt: null, resolvedBy: null });
    }
    const row = await this.pushMessage(
      ticket._id,
      this.buildMessage(userId, payload.body.trim(), payload.attachments, false),
      changes,
    );
    return this.getTransformed(row);
  }

  // ---- Course staff (teaching app) ----

  /**
   * A teacher's inbox: tickets about their organization's courses and sales. Reporters' emails stay
   * with platform staff.
   */
  async getOwnerInbox(org: Types.ObjectId, query: TicketInboxQueryDto): Promise<ITicketInbox<TicketDto>> {
    const inbox = await this.buildInbox({ ownerOrg: org }, query);
    return { ...inbox, reporters: inbox.reporters.map((reporter) => ({ ...reporter, email: null })) };
  }

  /** Open question, content and doubt tickets: the ones a teacher has to act on. Payment ones are read-only. */
  async getOwnerActiveCount(org: Types.ObjectId): Promise<number> {
    return this.ticketModel.countDocuments({
      ownerOrg: org,
      category: { $in: COURSE_TICKET_CATEGORIES },
      status: { $in: ACTIVE_TICKET_STATUSES },
      _deleted: { $ne: true },
    });
  }

  async getForOwner(org: Types.ObjectId, id: string): Promise<TicketDto> {
    return this.getTransformed(await this.getTicket({ kind: 'owner', org }, id));
  }

  // ---- Platform staff (support app, through @Private() routes) ----

  async getPlatformInbox(query: TicketInboxQueryDto): Promise<ITicketInbox<TicketDto>> {
    return this.buildInbox({}, query);
  }

  async getForPlatform(id: string): Promise<TicketDto> {
    return this.getTransformed(await this.getTicket({ kind: 'platform' }, id));
  }

  // ---- Handling, shared by course staff and platform staff ----

  /**
   * A staff reply. Course staff answer question, content and doubt tickets only; payment tickets belong to
   * the platform, which answers every kind.
   */
  async replyAsStaff(
    actor: TicketActor,
    staff: { org: Types.ObjectId; userId: Types.ObjectId },
    id: string,
    payload: TicketReplyDto,
  ): Promise<TicketDto> {
    this.assertAttachments(payload.attachments, staff.org);
    const ticket = await this.getHandledTicket(actor, id);
    const now = new Date();
    const changes: Partial<Ticket> = { lastStaffReplyAt: now };
    if (ticket.status === TicketStatus.OPEN) changes.status = TicketStatus.IN_PROGRESS;
    const row = await this.pushMessage(
      ticket._id,
      this.buildMessage(staff.userId, payload.body.trim(), payload.attachments, true),
      changes,
    );
    this.ticketMailService.notifyReporterOfReply(row);
    return this.getTransformed(row);
  }

  async setStatus(actor: TicketActor, staffId: Types.ObjectId, id: string, status: TicketStatus): Promise<TicketDto> {
    const ticket = await this.getHandledTicket(actor, id);
    const isClosing = !isActiveTicket(status);
    const wasActive = isActiveTicket(ticket.status);
    // Closing an already closed ticket keeps its first close: the reporter's reply window must not restart.
    const closed = isClosing && wasActive ? { resolvedAt: new Date(), resolvedBy: staffId } : {};
    const row = await this.ticketModel
      .findOneAndUpdate(
        { _id: ticket._id },
        { $set: { status, ...(isClosing ? closed : { resolvedAt: null, resolvedBy: null }) } },
        { returnDocument: 'after' },
      )
      .lean<TicketDocument>();
    if (!row) throw new NotFoundException('Report not found.');
    if (isClosing && wasActive) this.ticketMailService.notifyReporterOfClose(row);
    return this.getTransformed(row);
  }

  /**
   * Records a refund staff made in the Razorpay dashboard: ends the seats the payment bought, notes
   * it on the thread and resolves the ticket.
   */
  async recordRefund(staffId: Types.ObjectId, id: string, payload: RecordRefundDto): Promise<TicketDto> {
    const ticket = await this.getTicket({ kind: 'platform' }, id);
    if (ticket.category !== TicketCategory.PAYMENT) {
      throw new BadRequestException('Only a payment report has a refund.');
    }
    if (ticket.order) {
      await this.orderService.recordRefund(String(ticket.order), payload);
    } else if (ticket.enrollment) {
      const refunded = await this.enrollmentService.recordRefund(
        { _id: String(ticket.enrollment) },
        { ...payload, refundedAt: new Date() },
      );
      if (!refunded) throw new ConflictException('This purchase is not active, so there is nothing to refund.');
    } else {
      throw new BadRequestException('This report names no purchase.');
    }
    const now = new Date();
    const note = `A refund of ${payload.amount} has been issued (Razorpay refund ${payload.razorpayRefundId}). It usually reaches your account in 5–7 working days. Access to what it bought has ended.`;
    const row = await this.pushMessage(ticket._id, this.buildMessage(staffId, note, [], true), {
      status: TicketStatus.RESOLVED,
      resolvedAt: now,
      resolvedBy: staffId,
      lastStaffReplyAt: now,
    });
    this.ticketMailService.notifyReporterOfReply(row);
    return this.getTransformed(row);
  }

  // ---- Internals ----

  private async findOpenDuplicate(
    userId: Types.ObjectId,
    category: TicketCategory,
    target: ITicketTarget,
  ): Promise<TicketDocument | null> {
    // Each doubt is its own conversation; only reports of the same thing fold together.
    if (category === TicketCategory.DOUBT) return null;
    const key = this.getDuplicateKey(target);
    if (!key) return null;
    return this.ticketModel
      .findOne({
        ...key,
        createdBy: userId,
        category,
        status: { $in: ACTIVE_TICKET_STATUSES },
        _deleted: { $ne: true },
      })
      .lean<TicketDocument>();
  }

  /** The one thing a ticket is about, which a second open ticket from the same learner may not repeat. */
  private getDuplicateKey(target: ITicketTarget): QueryFilter<Ticket> | null {
    if (target.question) return { question: target.question };
    if (target.material) return { material: target.material };
    if (target.enrollment) return { enrollment: target.enrollment };
    if (target.order) return { order: target.order };
    if (target.testPaper) return { testPaper: target.testPaper, question: null };
    return null;
  }

  private assertAttachments(attachments: AttachmentDto[], org: Types.ObjectId): void {
    if (attachments.some((attachment) => !DISCUSSION_FILE_EXTENSIONS.includes(attachment.fileExtension))) {
      throw new BadRequestException('Only images and PDFs can be attached.');
    }
    if (attachments.some((attachment) => !this.s3Service.isOwnObjectUrl(attachment.url, String(org)))) {
      throw new BadRequestException('Attachments must be files uploaded with the report.');
    }
  }

  private buildMessage(
    author: Types.ObjectId,
    body: string,
    attachments: AttachmentDto[],
    isStaff: boolean,
  ): TicketMessageInput {
    if (!body && !attachments.length) throw new BadRequestException('A reply needs text or an attachment.');
    return { _id: new Types.ObjectId(), body, attachments, author, isStaff, createdAt: new Date() };
  }

  private async pushMessage(id: Types.ObjectId, message: TicketMessageInput, changes: Partial<Ticket>) {
    const row = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, _deleted: { $ne: true } },
        { $push: { messages: message }, $set: changes },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<TicketDocument>();
    if (!row) throw new NotFoundException('Report not found.');
    return row;
  }

  /** The ticket as the actor may see it, or a 404 — the same answer whether it is missing or not theirs. */
  private async getTicket(actor: TicketActor, id: string): Promise<TicketDocument> {
    const scope = this.getActorScope(actor);
    const row = await this.ticketModel.findOne({ _id: id, ...scope, _deleted: { $ne: true } }).lean<TicketDocument>();
    if (!row) throw new NotFoundException('Report not found.');
    return row;
  }

  private getActorScope(actor: TicketActor): QueryFilter<Ticket> {
    if (actor.kind === 'reporter') return { createdBy: actor.userId };
    if (actor.kind === 'owner') return { ownerOrg: actor.org };
    return {};
  }

  /** As `getTicket`, plus the rule that course staff handle question, content and doubt tickets only. */
  private async getHandledTicket(actor: TicketActor, id: string): Promise<TicketDocument> {
    const ticket = await this.getTicket(actor, id);
    if (actor.kind === 'owner' && !isCourseTicket(ticket.category)) {
      throw new ForbiddenException('Payment reports are handled by platform support.');
    }
    return ticket;
  }

  private async buildInbox(scope: QueryFilter<Ticket>, query: TicketInboxQueryDto): Promise<ITicketInbox<TicketDto>> {
    const rows = await this.ticketModel
      .find(
        {
          ...scope,
          _deleted: { $ne: true },
          ...(query.status === TicketInboxStatus.ACTIVE ? { status: { $in: ACTIVE_TICKET_STATUSES } } : {}),
          ...(query.category ? { category: query.category } : {}),
          ...(query.before ? { updatedAt: { $lt: new Date(query.before) } } : {}),
        },
        { messages: 0 },
      )
      .sort({ updatedAt: -1 })
      .limit(TICKET_LIMITS.PAGE_SIZE + 1)
      .lean<TicketDocument[]>();
    const page = rows.slice(0, TICKET_LIMITS.PAGE_SIZE);
    const reporters = await this.userService.getContactsByIds([...new Set(page.map((row) => String(row.createdBy)))]);
    return {
      tickets: page.map((row) => this.getTransformed(row)),
      reporters,
      hasMore: rows.length > TICKET_LIMITS.PAGE_SIZE,
    };
  }

  private getTransformed(row: TicketDocument): TicketDto {
    const toId = (id: Types.ObjectId | null) => (id ? String(id) : null);
    return {
      ...getTransformedBaseFields(row),
      code: row.code,
      category: row.category,
      reason: row.reason,
      status: row.status,
      body: row.body,
      attachments: row.attachments,
      course: toId(row.course),
      courseModule: toId(row.courseModule),
      material: toId(row.material),
      testPaper: toId(row.testPaper),
      question: toId(row.question),
      enrollment: toId(row.enrollment),
      order: toId(row.order),
      ownerOrg: toId(row.ownerOrg),
      targetName: row.targetName,
      courseName: row.courseName,
      pageUrl: row.pageUrl,
      // A list row is read without its thread, and stays without one so a client knows to fetch it.
      ...(row.messages
        ? {
            messages: row.messages.map((message) => ({
              _id: String(message._id),
              body: message.body,
              attachments: message.attachments,
              author: String(message.author),
              isStaff: message.isStaff,
              createdAt: message.createdAt.toISOString(),
            })),
          }
        : {}),
      lastStaffReplyAt: row.lastStaffReplyAt?.toISOString() ?? null,
      reporterSeenAt: row.reporterSeenAt?.toISOString() ?? null,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      _deleted: row._deleted,
    };
  }
}

export type { TicketActor };
