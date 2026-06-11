import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TestPaperDocument = TestPaper & Document;

@Schema({ timestamps: true })
export class TestPaper extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop({ type: Number, default: 0 })
  totalMarks: number;

  @Prop({ type: Number, default: 0 })
  duration: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  org: string;
}

export const TestPaperSchema = SchemaFactory.createForClass(TestPaper);
