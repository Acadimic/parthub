import { Injectable } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { TestPaperSectionsResponse } from '@repo/shared/contracts';
import { TestPaperDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { QuestionService } from '../question/question.service';
import { TestPaperSectionService } from './test-paper-section.service';
import { TestPaperTotalsService } from './test-paper-totals.service';
import { TestPaper, TestPaperDocument } from './test-paper.schema';

@Injectable()
export class TestPaperService {
  constructor(
    @InjectModel(TestPaper.name) private testPaperModel: Model<TestPaperDocument>,
    private readonly testPaperSectionService: TestPaperSectionService,
    private readonly questionService: QuestionService,
    private readonly testPaperTotalsService: TestPaperTotalsService,
  ) {}

  /**
   * The wire shape of a testpaper.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedTestPaper(testPaper: TestPaperDocument): TestPaperDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (testPaper as { __v?: number }).__v;
    return {
      ...testPaper,
      ...getTransformedBaseFields(testPaper),
      standards: (testPaper.standards ?? []).map(String),
      subjects: (testPaper.subjects ?? []).map(String),
      sections: (testPaper.sections ?? []).map(String),
      mergedTestPapers: (testPaper.mergedTestPapers ?? []).map(String),
      publishedDate: testPaper.publishedDate?.toISOString(),
      isLockedDate: testPaper.isLockedDate?.toISOString(),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedTestPapers(testPapers: TestPaperDocument[]): TestPaperDto[] {
    return (testPapers ?? []).map((testPaper) => this.getTransformedTestPaper(testPaper));
  }

  async upsert(org: Types.ObjectId, payload: TestPaperDto): Promise<TestPaperDto> {
    const { _id } = payload;
    return this.testPaperModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<TestPaperDocument>()
      .then((testPaper) => this.getTransformedTestPaper(testPaper));
  }

  async getOrgTestPapers(org: Types.ObjectId): Promise<TestPaperDto[]> {
    return this.testPaperModel
      .find({ org, _deleted: { $ne: true } })
      .lean<TestPaperDocument[]>()
      .then((testPapers) => this.getTransformedTestPapers(testPapers));
  }

  async findAll(org: Types.ObjectId): Promise<TestPaperDto[]> {
    return this.getOrgTestPapers(org);
  }

  async getOrgTestPaperById(org: Types.ObjectId, id: string): Promise<TestPaperDto | null> {
    return this.testPaperModel
      .findOne({ _id: id, org, _deleted: { $ne: true } })
      .lean<TestPaperDocument>()
      .then((testPaper) => (testPaper ? this.getTransformedTestPaper(testPaper) : null));
  }

  /**
   * A paper's sections and their questions, in one round trip.
   *
   * Three queries, two of them in parallel, and the count stops depending on the size of the paper.
   * Questions are fetched by the paper's **top-level** section ids alone: every question stores its
   * top-level section even when it also stores a subsection, so this one filter reaches the whole
   * tree without walking it. Options and solutions are embedded in each question, so they need no
   * queries of their own.
   */
  async getSectionsWithQuestions(org: Types.ObjectId, testPaperId: string): Promise<TestPaperSectionsResponse> {
    const testPaper = await this.getOrgTestPaperById(org, testPaperId);
    if (!testPaper) return { sections: [], questions: [] };

    const sectionIds = testPaper.sections ?? [];
    const [topLevelSections, questions] = await Promise.all([
      this.testPaperSectionService.getByIds(org, sectionIds),
      this.questionService.getQuestionsBySectionIds(org, sectionIds),
    ]);

    // Subsections are referenced by their parent rather than by the paper, so they are a second
    // hop. Their questions already arrived above, keyed on the top-level section.
    const subsectionIds = topLevelSections.flatMap((section) => section.subsections ?? []);
    const subsections = await this.testPaperSectionService.getByIds(org, subsectionIds);

    return {
      sections: [...topLevelSections, ...subsections],
      questions,
    };
  }

  /**
   * Fold the secondary paper's sections into the primary.
   *
   * Sections are **shared, not copied**: both papers end up referencing the same section documents,
   * so editing one afterwards changes both. That is the existing behaviour and it is deliberate
   * here, but it is an open product decision — see `COURSE_PLATFORM_STRUCTURE.md` §11 on whether a
   * merge should fork instead.
   */
  async mergeTestPapers(
    org: Types.ObjectId,
    primaryTestPaperId: string,
    secondaryTestPaperId: string,
  ): Promise<TestPaperDto | null> {
    const secondaryTestPaper = await this.getOrgTestPaperById(org, secondaryTestPaperId);
    if (!secondaryTestPaper) throw new Error('Secondary test paper not found');

    const merged = await this.testPaperModel
      .findOneAndUpdate(
        { _id: primaryTestPaperId, org },
        {
          $addToSet: {
            sections: secondaryTestPaper.sections,
            standards: secondaryTestPaper.standards,
            subjects: secondaryTestPaper.subjects,
            mergedTestPapers: secondaryTestPaperId,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<TestPaperDocument>()
      .then((testPaper) => (testPaper ? this.getTransformedTestPaper(testPaper) : null));

    // Totals are derived, so they are recomputed rather than `$inc`-ed from the secondary's own
    // figures — which would double-count a section the two papers already shared.
    const [firstSection] = secondaryTestPaper.sections ?? [];
    if (firstSection) await this.testPaperTotalsService.recalculateForSection(org, firstSection);

    return merged;
  }
}
