import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CourseReviewDocument = HydratedDocument<CourseReview>;

/** A learner's rating of a course. `org` is the learner's organization; reads go by `course`. */
@Schema({ timestamps: true })
export class CourseReview extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true, immutable: true })
  course: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, trim: true, default: '' })
  body: string;
}

export const CourseReviewSchema = SchemaFactory.createForClass(CourseReview);

// One live review per learner per course; the upsert finds it by this pair.
CourseReviewSchema.index({ createdBy: 1, course: 1 }, { unique: true, partialFilterExpression: { _deleted: false } });
// A page of a course's reviews newest first, and the summary's group by rating.
CourseReviewSchema.index({ course: 1, createdAt: -1 });
