import { getTransformedBaseFields } from '@database/base.transform';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TestPaperResultDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { QuestionService } from '../question/question.service';
import { TestPaperResult, TestPaperResultDocument } from './schemas/test-paper-result.schema';
import { markResponses } from './test-paper-result.marking';

@Injectable()
export class TestPaperResultService {
  constructor(
    @InjectModel(TestPaperResult.name) private resultModel: Model<TestPaperResultDocument>,
    private readonly questionService: QuestionService,
  ) {}

  /** The wire shape of a sitting; lists the ids so `ObjectId`s leave as strings. */
  getTransformedResult(row: TestPaperResultDocument): TestPaperResultDto {
    delete (row as { __v?: number }).__v;
    return {
      ...row,
      ...getTransformedBaseFields(row),
      testPaper: String(row.testPaper),
      course: String(row.course),
      sections: (row.sections ?? []).map(String),
      questions: (row.questions ?? []).map(String),
      standards: (row.standards ?? []).map(String),
      subjects: (row.subjects ?? []).map(String),
      responseMaps: row.responseMaps as unknown as Record<string, string[]>,
      questionWiseSpendTime: row.questionWiseSpendTime as unknown as Record<string, number>,
      questionWiseReplyTime: row.questionWiseReplyTime as unknown as Record<string, number>,
      sectionWiseQuestionIdsMaps: row.sectionWiseQuestionIdsMaps as unknown as Record<string, string[]>,
      resultMaps: row.resultMaps as unknown as TestPaperResultDto['resultMaps'],
      marksObtained: row.marksObtained ?? 0,
      answerMaps: row.answerMaps as unknown as Record<string, string[]>,
    };
  }

  /**
   * Saves a sitting, marked here. The questions are read under the paper owner's organization —
   * the caller has already checked the paper is reachable through a course they may open — while
   * the row itself is stamped with the learner's own. Filtered by `createdBy` as well as `_id` so
   * a client-minted id cannot overwrite another learner's sitting.
   */
  async upsert(
    paperOrg: Types.ObjectId,
    userId: Types.ObjectId,
    payload: TestPaperResultDto,
  ): Promise<TestPaperResultDto> {
    const questions = await this.questionService.getQuestionsByIds(paperOrg, payload.questions);
    const marked = markResponses(questions, payload.responseMaps);
    // Whatever the client sent for the marked fields is replaced, never merged.
    const { _id, resultMaps: _resultMaps, answerMaps: _answerMaps, marksObtained: _marks, ...fields } = payload;
    return this.resultModel
      .findOneAndUpdate(
        { _id, createdBy: userId },
        { $set: { ...fields, ...marked }, $setOnInsert: { _id } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<TestPaperResultDocument>()
      .then((row) => {
        if (!row) throw new InternalServerErrorException('Test paper result could not be saved.');
        return this.getTransformedResult(row);
      });
  }

  /** The caller's own sittings, newest first. */
  async getByUser(userId: Types.ObjectId): Promise<TestPaperResultDto[]> {
    return this.resultModel
      .find({ createdBy: userId, _deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean<TestPaperResultDocument[]>()
      .then((rows) => rows.map((row) => this.getTransformedResult(row)));
  }
}
