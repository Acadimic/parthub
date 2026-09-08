import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LevelType, QuestionType } from '@parthhub/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MarkingSchemaDocument = HydratedDocument<MarkingSchema>;

@Schema({ _id: false })
export class MarkingSchema {
  @Prop({ type: Number, required: true })
  correct: number;

  @Prop({ type: Number, required: true })
  incorrect: number;

  @Prop({ type: Number, required: true })
  unattempted: number;
}

export const MarkingSchemaDefinition = SchemaFactory.createForClass(MarkingSchema);

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  question: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
  standard: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subject: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chapter' })
  chapter: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Material' })
  material: string;

  @Prop({ type: Number })
  year: number;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Option' }])
  options: string[];

  @Prop({ type: String, enum: QuestionType })
  questionType: QuestionType;

  @Prop({ type: String, trim: true })
  tag: string;

  @Prop({ type: MarkingSchemaDefinition })
  markings: MarkingSchema;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' })
  section: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' })
  subsection: string;

  @Prop({ type: String, enum: LevelType })
  level: LevelType;

  @Prop({ type: Number, default: 0 })
  marks: number;

  @Prop()
  type: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper' })
  testPaper: string;

  @Prop({ type: String })
  text: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ standard: 1 });
QuestionSchema.index({ section: 1 });
QuestionSchema.index({ section: 1, isDeleted: 1 });
