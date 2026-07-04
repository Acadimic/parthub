import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestPaperDocument = HydratedDocument<TestPaper>;

@Schema({ timestamps: true })
export class TestPaper extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop({ type: Number, default: 0 })
  totalMarks: number;

  @Prop({ type: Number, default: 0 })
  duration: number;
}

export const TestPaperSchema = SchemaFactory.createForClass(TestPaper);
