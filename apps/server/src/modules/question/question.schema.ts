import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question extends BaseSchema {
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
