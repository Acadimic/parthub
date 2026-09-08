import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type CourseContentDocument = HydratedDocument<CourseContent>;

@Schema({ timestamps: true })
export class CourseContent extends BaseSchema {
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
}

export const CourseContentSchema = SchemaFactory.createForClass(CourseContent);

CourseContentSchema.index({ course: 1, day: 1 }, { unique: true });
CourseContentSchema.index({ org: 1, _deleted: 1 });
