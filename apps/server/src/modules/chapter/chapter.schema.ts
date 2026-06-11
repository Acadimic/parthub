import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true })
export class Chapter extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
