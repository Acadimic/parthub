import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type IAiPendingWork } from '@repo/shared/interfaces';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type CourseModuleDocument = HydratedDocument<CourseModule>;

/**
 * A day of a course: what a learner works through, and the material, tests and sessions it holds.
 *
 * The collection is named explicitly rather than left to Mongoose's pluralisation of the class,
 * because the class has been renamed once already: it was `CourseContent`, whose documents lived in
 * `coursecontents` and were moved across by hand. Nothing fails loudly when a class rename moves the
 * collection — the server starts, the queries run, and every course simply has no modules. Spelling
 * the name out is what stops that happening a second time.
 */
@Schema({ timestamps: true, collection: 'coursemodules' })
export class CourseModule extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;

  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, required: true })
  day: number;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Material' }])
  materials: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper' }])
  testPapers: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Meet' }])
  meets: string[];

  @Prop({ type: [String], default: undefined })
  topics: string[];

  @Prop({ type: Number })
  week: number;

  /** `IAiPendingWork[]`; the spec inside varies by kind, so the array is stored as-is. */
  @Prop({ type: [MongooseSchema.Types.Mixed], default: undefined })
  pending: IAiPendingWork[];
}

export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);

CourseModuleSchema.index({ course: 1, day: 1 }, { unique: true });
CourseModuleSchema.index({ org: 1, _deleted: 1 });
