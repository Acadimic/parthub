import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PaperCategoryType, PaperType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TestPaperDocument = HydratedDocument<TestPaper>;

@Schema({ timestamps: true })
export class TestPaper extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }])
  standards: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Subject' }])
  subjects: string[];

  @Prop({ type: Boolean, default: false })
  isPublished: boolean;

  @Prop({ type: Date })
  publishedDate: Date;

  @Prop({ type: String })
  webLink: string;

  @Prop({ type: String })
  appLink: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' }])
  sections: string[];

  @Prop({ type: Number, default: 0 })
  totalQuestions: number;

  @Prop({ type: Number, default: 0 })
  durationMins: number;

  @Prop({ type: Number })
  year: number;

  @Prop({ type: Number, default: 0 })
  maxMarks: number;

  @Prop({ type: String, enum: PaperType })
  paperType: PaperType;

  @Prop({ type: String })
  instruction: string;

  @Prop({ type: String, enum: PaperCategoryType })
  paperCategory: PaperCategoryType;

  @Prop({ type: Boolean, default: false })
  isLocked: boolean;

  @Prop({ type: Date })
  isLockedDate: Date;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper' }])
  mergedTestPapers: string[];

  @Prop()
  type: string;

  @Prop({ type: Number, default: 0 })
  totalMarks: number;

  @Prop({ type: Number, default: 0 })
  duration: number;
}

export const TestPaperSchema = SchemaFactory.createForClass(TestPaper);

TestPaperSchema.index({ org: 1, _deleted: 1 });
