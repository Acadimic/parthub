import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  thumbnail: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  org: string;

  @Prop()
  status: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
