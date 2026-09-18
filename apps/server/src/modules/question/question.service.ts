import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './question.schema';
import { QuestionDto } from '@repo/shared/validations';

/** One section's question count and mark total, as returned by `getSectionTotals`. */
export interface ISectionTotals {
  _id: Types.ObjectId;
  totalQuestions: number;
  maxMarks: number;
}

@Injectable()
export class QuestionService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  /**
   * The wire shape of a question.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedQuestion(question: QuestionDocument): QuestionDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (question as { __v?: number }).__v;
    return {
      ...question,
      ...getTransformedBaseFields(question),
      section: question.section?.toString(),
      subsection: question.subsection?.toString(),
      standard: question.standard?.toString(),
      subject: question.subject?.toString(),
      chapter: question.chapter?.toString(),
      options: (question.options ?? []).map((option) => ({ ...option, _id: option._id.toString() })),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedQuestions(questions: QuestionDocument[]): QuestionDto[] {
    return (questions ?? []).map((question) => this.getTransformedQuestion(question));
  }

  async upsert(org: Types.ObjectId, payload: QuestionDto): Promise<QuestionDto> {
    const { _id } = payload;
    return this.questionModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<QuestionDocument>()
      .then((question) => {
        // `lean<T>()` states the element type and drops the `| null` an upsert can still return, so
        // the miss has to be checked rather than trusted.
        if (!question) throw new InternalServerErrorException('Question was not saved.');
        return this.getTransformedQuestion(question);
      });
  }

  async getQuestionsByIds(org: Types.ObjectId, ids: string[]): Promise<QuestionDocument[]> {
    if (!ids.length) return [];
    return this.questionModel.find({ _id: { $in: ids }, org, _deleted: { $ne: true } }).lean<QuestionDocument[]>();
  }

  /**
   * A paper's questions, in reading order.
   *
   * One query for the whole paper, subsections included: every question carries its **top-level**
   * section (see `Question.section`), so the paper's own `sections[]` is a sufficient filter and
   * the section tree never has to be walked first. The sort is served by
   * `{ section: 1, order: 1 }`.
   */
  async getQuestionsBySectionIds(org: Types.ObjectId, sectionIds: string[]): Promise<QuestionDto[]> {
    if (!sectionIds.length) return [];
    return this.questionModel
      .find({ section: { $in: sectionIds }, org, _deleted: { $ne: true } })
      .sort({ section: 1, order: 1 })
      .lean<QuestionDocument[]>()
      .then((questions) => this.getTransformedQuestions(questions));
  }

  async findAll(org: Types.ObjectId): Promise<QuestionDto[]> {
    return this.questionModel
      .find({ org, _deleted: { $ne: true } })
      .lean<QuestionDocument[]>()
      .then((questions) => this.getTransformedQuestions(questions));
  }

  async findById(org: Types.ObjectId, id: string): Promise<QuestionDto | null> {
    return this.questionModel
      .findOne({ _id: id, org, _deleted: { $ne: true } })
      .lean<QuestionDocument>()
      .then((question) => (question ? this.getTransformedQuestion(question) : null));
  }
}
