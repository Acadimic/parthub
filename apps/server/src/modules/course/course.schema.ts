import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  thumbnail: string;

  @Prop()
  status: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
