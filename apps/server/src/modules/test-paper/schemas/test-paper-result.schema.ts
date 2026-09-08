import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Marking, PaperCategoryType, PaperType } from '@repo/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TestPaperResultDocument = HydratedDocument<TestPaperResult>;

@Schema({ timestamps: true })
export class TestPaperResult extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper', required: true })
  testPaper: string;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  instruction: string;

  @Prop({ type: Map, of: Number, default: {} })
  questionWiseSpendTime: Map<string, number>;

  @Prop({ type: Map, of: Number, default: {} })
  questionWiseReplyTime: Map<string, number>;

  @Prop({ type: Number })
  totalSpendTime: number;

  @Prop({ type: Map, of: [String], default: {} })
  answerMaps: Map<string, string[]>;

  @Prop({ type: Map, of: [String], default: {} })
  responseMaps: Map<string, string[]>;

  @Prop({ type: [String], default: [] })
  visited: string[];

  @Prop({ type: [String], default: [] })
  markedForReviews: string[];

  @Prop({ type: Map, of: [String], default: {} })
  sectionWiseQuestionIdsMaps: Map<string, string[]>;

  @Prop({ type: Number })
  numberOfQuestions: number;

  @Prop({ type: Number })
  durationMins: number;

  @Prop({ type: Number })
  maxMarks: number;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' }])
  sections: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Question' }])
  questions: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }])
  standards: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Subject' }])
  subjects: string[];

  @Prop({
    type: Map,
    of: { type: String, enum: Object.values(Marking) },
    default: {},
  })
  resultMaps: Map<string, Marking>;

  @Prop({ type: String, enum: PaperCategoryType })
  paperCategory: PaperCategoryType;

  @Prop({ type: String, enum: PaperType })
  paperType: PaperType;

  @Prop({ type: Number })
  year: number;
}

export const TestPaperResultSchema = SchemaFactory.createForClass(TestPaperResult);

TestPaperResultSchema.index({ org: 1, _deleted: 1 });
TestPaperResultSchema.index({ createdBy: 1, _deleted: 1 });
