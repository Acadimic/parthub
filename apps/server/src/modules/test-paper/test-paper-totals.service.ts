import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../question/question.schema';
import { TestPaper, TestPaperDocument } from './test-paper.schema';

/** One section's question count and mark total. */
interface ISectionTotals {
  _id: Types.ObjectId;
  totalQuestions: number;
  maxMarks: number;
}

/**
 * Keeps `TestPaper.totalQuestions` and `maxMarks` true.
 *
 * Its own service, injecting both models and depending on neither module, because both the question
 * write path and the section write path have to trigger it — and having either module import the
 * other would be a cycle.
 *
 * Both values are derived, so nothing outside this service sets them. The endpoints stopped
 * accepting them as inputs for the same reason: a value the server can compute is not one a client
 * should be able to assert.
 */
@Injectable()
export class TestPaperTotalsService {
  constructor(
    @InjectModel(TestPaper.name) private testPaperModel: Model<TestPaperDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  /**
   * Count and mark total per section.
   *
   * Grouped by `section` rather than joined from papers on purpose: a `$lookup` correlating on
   * `$expr: { $in: ['$section', '$$sectionIds'] }` cannot use `{ section: 1, order: 1 }` and would
   * scan, whereas this `$match` is a plain indexed equality.
   */
  private async getSectionTotals(org: Types.ObjectId, sectionIds: string[]): Promise<ISectionTotals[]> {
    if (!sectionIds.length) return [];
    return this.questionModel.aggregate<ISectionTotals>([
      // $match on org first: correctness, and it is what makes the index usable.
      {
        $match: {
          org,
          section: { $in: sectionIds.map((id) => new Types.ObjectId(id)) },
          _deleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: '$section',
          totalQuestions: { $sum: 1 },
          maxMarks: { $sum: { $ifNull: ['$markings.correct', 0] } },
        },
      },
    ]);
  }

  /**
   * Recompute every paper that references `sectionId`.
   *
   * The fan-out is the point. A section may belong to several papers, so a question added to one
   * changes the totals of all of them — which the client cannot know, because it does not know
   * which other papers reference the section.
   */
  async recalculateForSection(org: Types.ObjectId, sectionId: string): Promise<void> {
    const papers = await this.testPaperModel
      .find({ sections: sectionId, org, _deleted: { $ne: true } })
      .select('_id sections')
      .lean<Pick<TestPaperDocument, '_id' | 'sections'>[]>();
    if (!papers.length) return;

    const sectionIds = [...new Set(papers.flatMap((paper) => paper.sections ?? []))];
    const totals = await this.getSectionTotals(org, sectionIds);
    const bySection = new Map(totals.map((row) => [String(row._id), row]));

    await this.testPaperModel.bulkWrite(
      papers.map((paper) => ({
        updateOne: {
          filter: { _id: paper._id, org },
          update: {
            $set: (paper.sections ?? []).reduce(
              (acc, id) => {
                const row = bySection.get(String(id));
                if (!row) return acc;
                return {
                  totalQuestions: acc.totalQuestions + row.totalQuestions,
                  maxMarks: acc.maxMarks + row.maxMarks,
                };
              },
              { totalQuestions: 0, maxMarks: 0 },
            ),
          },
        },
      })),
    );
  }
}
