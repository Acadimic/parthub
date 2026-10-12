import { BaseSchema } from '@database/base.schema';
import { Attachment, AttachmentSchema } from '@modules/material/material.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TicketCategory, TicketReason, TicketStatus } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ _id: false })
export class TicketMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  _id: Types.ObjectId;

  /** Empty when the reply is only files; the service refuses a reply with neither. */
  @Prop({ type: String, trim: true, default: '' })
  body: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isStaff: boolean;

  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

/**
 * A reported issue. `org` and `createdBy` are the reporter's; `ownerOrg` is the organization whose
 * course or sale it is about, which answers question, content and doubt tickets and sees payment ones.
 * Platform staff see every ticket.
 */
@Schema({ timestamps: true })
export class Ticket extends BaseSchema {
  @Prop({ type: String, required: true, immutable: true })
  code: string;

  @Prop({ type: String, enum: TicketCategory, required: true, immutable: true })
  category: TicketCategory;

  @Prop({ type: String, enum: TicketReason, required: true })
  reason: TicketReason;

  @Prop({ type: String, enum: TicketStatus, required: true, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: String, trim: true, required: true })
  body: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', default: null, immutable: true })
  course: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CourseModule', default: null, immutable: true })
  courseModule: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Material', default: null, immutable: true })
  material: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper', default: null, immutable: true })
  testPaper: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Question', default: null, immutable: true })
  question: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Enrollment', default: null, immutable: true })
  enrollment: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', default: null, immutable: true })
  order: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', default: null, immutable: true })
  ownerOrg: Types.ObjectId | null;

  /** Names as they were when reported, so the ticket still reads after the content changes. */
  @Prop({ type: String, default: '' })
  targetName: string;

  @Prop({ type: String, default: '' })
  courseName: string;

  @Prop({ type: String, default: '' })
  pageUrl: string;

  @Prop({ type: [TicketMessageSchema], default: [] })
  messages: TicketMessage[];

  @Prop({ type: Date, default: null })
  lastStaffReplyAt: Date | null;

  @Prop({ type: Date, default: null })
  reporterSeenAt: Date | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  resolvedBy: Types.ObjectId | null;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// TicketService.getOwnerInbox / getOwnerActiveCount: { ownerOrg, _deleted, status } by latest activity.
TicketSchema.index({ ownerOrg: 1, _deleted: 1, status: 1, updatedAt: -1 });
// TicketService.getPlatformInbox filtered by category.
TicketSchema.index({ category: 1, _deleted: 1, status: 1, updatedAt: -1 });
// TicketService.getPlatformInbox with no category filter: the view platform staff open first.
TicketSchema.index({ status: 1, _deleted: 1, updatedAt: -1 });
// TicketService.getMine, the daily cap and the open-duplicate check: { createdBy, _deleted } newest first.
TicketSchema.index({ createdBy: 1, _deleted: 1, createdAt: -1 });
TicketSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { _deleted: false } });
