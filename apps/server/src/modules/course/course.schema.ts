import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AttachmentSchema, Attachment } from '@modules/material/material.schema';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Stats {
  @Prop({ type: Number, default: 0 })
  daysCount: number;

  @Prop({ type: Number, default: 0 })
  videosCount: number;

  @Prop({ type: Number, default: 0 })
  readingsCount: number;

  @Prop({ type: Number, default: 0 })
  testsCount: number;

  @Prop({ type: Number, default: 0 })
  meetsCount: number;

  @Prop({ type: Number, default: 0 })
  testsDurationMins: number;

  @Prop({ type: Number, default: 0 })
  materialsDurationMins: number;

  @Prop({ type: Number, default: 0 })
  meetsDurationMins: number;
}

export const StatsSchema = SchemaFactory.createForClass(Stats);

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  thumbnail: string;

  @Prop({ type: String })
  status: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }])
  standards: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Subject' }])
  subjects: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Course' }], default: [] })
  courses: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Meet' }])
  meets: string[];

  @Prop({ type: Boolean, default: false })
  isPublished: boolean;

  @Prop({ type: Date })
  publishedDate: Date;

  @Prop({ type: Number })
  order: number;

  @Prop({ type: String, trim: true })
  tag: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  stats: Stats;

  @Prop({ type: [String], default: undefined })
  outline: string[];

  @Prop({ type: [String], default: undefined })
  outcomes: string[];

  @Prop({ type: [String], default: undefined })
  prerequisites: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({ org: 1, _deleted: 1 });
// CourseService.getPublishedCourses, the public catalogue. `_deleted` is a `$ne`, a range, so it goes
// after the sort keys or the sort cannot come from the index.
CourseSchema.index({ isPublished: 1, order: 1, publishedDate: -1, _deleted: 1 });
