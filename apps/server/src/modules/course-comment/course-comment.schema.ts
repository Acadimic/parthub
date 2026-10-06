import { BaseSchema } from '@database/base.schema';
import { Attachment, AttachmentSchema } from '@modules/material/material.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CourseCommentDocument = HydratedDocument<CourseComment>;

/**
 * A comment in a course's discussion. `org` is the author's organization, not the course's: a
 * published course is discussed by learners of every organization, so reads go by `course`.
 */
@Schema({ timestamps: true })
export class CourseComment extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true, immutable: true })
  course: Types.ObjectId;

  /** The top-level comment this replies to; null on a top-level comment. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CourseComment', default: null, immutable: true })
  parent: Types.ObjectId | null;

  /** Where in the course it was written: the module, and the lesson or test paper open in it. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CourseModule', default: null, immutable: true })
  courseModule: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Material', default: null, immutable: true })
  material: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper', default: null, immutable: true })
  testPaper: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: '' })
  body: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  /** Written by staff of the organization that owns the course, from the teaching app. */
  @Prop({ type: Boolean, default: false, immutable: true })
  isStaff: boolean;

  /**
   * On a top-level comment: whether a staff reply is live under it. Kept in step by the service on
   * every staff reply and removal, so the inbox can filter on it.
   */
  @Prop({ type: Boolean, default: false })
  isAnswered: boolean;

  /** When the author last changed the text or files. `updatedAt` cannot say this: a reply or a
   *  moderation write touches the row too. */
  @Prop({ type: Date, default: null })
  editedAt: Date | null;
}

export const CourseCommentSchema = SchemaFactory.createForClass(CourseComment);

// A page of top-level comments (`parent: null`) newest first, and the replies of a page by `parent`.
CourseCommentSchema.index({ course: 1, parent: 1, createdAt: -1 });
CourseCommentSchema.index({ parent: 1, createdAt: 1 });
