import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TicketCategory, TicketInboxStatus, TicketReason, TicketStatus } from '../../../enums/ticket.enum';
import { TICKET_LIMITS } from '../../../utils/ticket.util';
import { AttachmentDto } from '../attachment.dto';
import { BaseOwnedDto } from '../base-owned.dto';

/** One reply on a ticket, from the reporter or from whoever handles it. Response-only. */
export class TicketMessageDto {
  @IsMongoId()
  _id: string;

  @IsString()
  body: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];

  @IsMongoId()
  author: string;

  /** Written by the course's staff or by platform staff, not by the reporter. */
  @IsBoolean()
  isStaff: boolean;

  /** ISO 8601 */
  @IsDateString()
  createdAt: string;
}

/**
 * The single field list for a reported issue, used for the create body and the response. Which of
 * the target ids are set depends on `category`, and the server checks them: a question ticket names
 * the course, test paper and question; a content ticket or a doubt the course and the lesson or paper (a doubt may name a
 * question instead); a payment ticket the enrollment or the order. Ownership and handling are always decided server side.
 */
export class TicketDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsEnum(TicketReason)
  reason: TicketReason;

  @IsString()
  @Matches(/\S/, { message: 'Describe the problem in a line or two.' })
  @MaxLength(TICKET_LIMITS.MAX_BODY_LENGTH)
  body: string;

  @IsArray()
  @ArrayMaxSize(TICKET_LIMITS.MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];

  @IsOptional()
  @IsMongoId()
  course?: string | null;

  @IsOptional()
  @IsMongoId()
  courseModule?: string | null;

  @IsOptional()
  @IsMongoId()
  material?: string | null;

  @IsOptional()
  @IsMongoId()
  testPaper?: string | null;

  @IsOptional()
  @IsMongoId()
  question?: string | null;

  @IsOptional()
  @IsMongoId()
  enrollment?: string | null;

  @IsOptional()
  @IsMongoId()
  order?: string | null;

  /** The page the learner reported from, so staff can open what they saw. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pageUrl?: string;

  /** Response-only. Short id to quote, e.g. `T-7K2Q9`. */
  @IsOptional()
  @IsString()
  code?: string;

  /** Response-only. */
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  /**
   * Response-only. The organization whose course or sale the ticket is about: it answers question,
   * content and doubt tickets and sees payment ones. Null for general and contact tickets.
   */
  @IsOptional()
  @IsMongoId()
  ownerOrg?: string | null;

  /** Response-only. The name of what was reported (paper, lesson, course or plan), kept as it was. */
  @IsOptional()
  @IsString()
  targetName?: string;

  /** Response-only. The course's name, kept as it was. */
  @IsOptional()
  @IsString()
  courseName?: string;

  /** Response-only. Replies, oldest first. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketMessageDto)
  messages?: TicketMessageDto[];

  /** Response-only. ISO 8601: the last staff reply, which the reporter has not seen if after `reporterSeenAt`. */
  @IsOptional()
  @IsDateString()
  lastStaffReplyAt?: string | null;

  /** Response-only. ISO 8601: when the reporter last opened the ticket. */
  @IsOptional()
  @IsDateString()
  reporterSeenAt?: string | null;

  /** Response-only. ISO 8601 */
  @IsOptional()
  @IsDateString()
  resolvedAt?: string | null;
}

/** `POST ticket/.../reply`. The text may be empty when files are attached; the server refuses neither. */
export class TicketReplyDto {
  @IsString()
  @MaxLength(TICKET_LIMITS.MAX_BODY_LENGTH)
  body: string;

  @IsArray()
  @ArrayMaxSize(TICKET_LIMITS.MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];
}

/** `POST ticket/.../status` */
export class TicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}

/** Filters for a teacher's or platform staff's ticket inbox. */
export class TicketInboxQueryDto {
  @IsEnum(TicketInboxStatus)
  status: TicketInboxStatus;

  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  /** ISO 8601 cursor: tickets last updated before this. Absent for the first page. */
  @IsOptional()
  @IsDateString()
  before?: string;
}

/**
 * `POST ticket/support/:id/refund`: a refund staff already made in the Razorpay dashboard. Recording
 * it ends the seat the payment bought and resolves the ticket.
 */
export class RecordRefundDto {
  @IsString()
  @IsNotEmpty()
  razorpayRefundId: string;

  /** In the currency's major unit, as the enrollment and order store amounts. */
  @IsNumber()
  @Min(0)
  amount: number;
}
