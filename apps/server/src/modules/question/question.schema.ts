import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question extends BaseOwnerSchema {
  @Prop({ required: true })
  text: string;

  @Prop()
  type: string;

  @Prop({ type: Number, default: 0 })
  marks: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper' })
  testPaper: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
