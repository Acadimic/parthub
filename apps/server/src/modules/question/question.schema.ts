import { BaseSchema } from '@database/base.schema';
import { Marking, MarkingSchemaDefinition } from '@database/marking.schema';
import { RichText, RichTextSchemaDefinition } from '@database/rich-text.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LevelType, QuestionType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * One answer option.
 *
 * Embedded rather than a collection of its own: an option has no identity outside its question, no
 * independent lifecycle, is never read without it, and the count is bounded at four to six. It
 * keeps an `_id` so the editor has a stable key while the author is still typing.
 */
@Schema({ _id: true })
export class QuestionOption {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: RichTextSchemaDefinition, required: true })
  body: RichText;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;
}

export const QuestionOptionSchemaDefinition = SchemaFactory.createForClass(QuestionOption);

/** The worked answer. Embedded for the same reasons as `QuestionOption`, and strictly one per question. */
@Schema({ _id: false })
export class QuestionSolution {
  @Prop({ type: RichTextSchemaDefinition, required: true })
  body: RichText;
}

export const QuestionSolutionSchemaDefinition = SchemaFactory.createForClass(QuestionSolution);

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question extends BaseSchema {
  @Prop({ type: RichTextSchemaDefinition, required: true })
  body: RichText;

  /**
   * The section this question belongs to — **always the top-level one**, even when `subsection` is
   * also set. A paper's questions therefore load in one query keyed on the paper's own `sections[]`,
   * subsection questions included; were this the innermost container instead, that query would
   * silently miss them and the section tree would have to be walked first.
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection', required: true })
  section: string;

  /** Set in addition to `section`, and only when the question sits inside a nested subsection. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' })
  subsection: string;

  /**
   * Position within `subsection` when set, otherwise within `section`.
   *
   * Explicit because the linkage points from question to section: a parent-pointing reference
   * yields a set, never a sequence, so without this the order is whatever the storage engine
   * returns and "question 1" is not reliably question 1.
   */
  @Prop({ type: Number, required: true, default: 0 })
  order: number;

  @Prop({ type: [QuestionOptionSchemaDefinition], default: [] })
  options: QuestionOption[];

  @Prop({ type: QuestionSolutionSchemaDefinition })
  solution: QuestionSolution;

  @Prop({ type: String, enum: QuestionType })
  questionType: QuestionType;

  /** The mark value lives here — `markings.correct` is what a paper's `maxMarks` sums. */
  @Prop({ type: MarkingSchemaDefinition })
  markings: Marking;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
  standard: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subject: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chapter' })
  chapter: string;

  @Prop({ type: String, enum: LevelType })
  level: LevelType;

  @Prop({ type: String, trim: true })
  tag: string;

  @Prop({ type: Number })
  year: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// The hot read path: a paper's questions, in order. Serves the `section` equality *and* the sort,
// which is why the plain `{ section: 1 }` it replaces is redundant.
QuestionSchema.index({ section: 1, order: 1 });
QuestionSchema.index({ org: 1, _deleted: 1 });
