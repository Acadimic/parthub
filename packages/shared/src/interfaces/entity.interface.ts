import type { CollectionType } from '../enums/plan.enum';
import type { Marking, SectionCategoryType, SectionType } from '../enums/test-paper.enum';
import type { QuestionType } from '../enums/question.enum';

/**
 * Client shapes for entities the API serves but has **no validation DTO for**.
 *
 * Everything else a store holds is typed from its DTO in `contracts/` (see decision 1 of the
 * Zustand migration plan). These four have no DTO, so this is their single declaration rather than
 * a duplicate of one — and it belongs here rather than in an app because teaching and learning both
 * hold them.
 *
 * Each is written from the server's Mongoose schema, except `ICourseModuleFields`: the server has
 * routes for it (`course/upsert/course/module`, `course/course/modules/:courseId`) but no schema of
 * that name, so its shape comes from the client model that has been driving those routes. **Reconcile
 * it against the server before relying on it**, and add real DTOs for all four when the server grows
 * them.
 */

/** Marks a section applies by default, per question type. */
export type DefaultMarkingType = { [key in QuestionType]: MarkingType };

/** `question/schemas/option.schema.ts` */
export interface IOptionFields {
  _id: string;
  option: string;
  question: string;
  isCorrect: boolean;
}

/** `question/schemas/solution.schema.ts` */
export interface ISolutionFields {
  _id: string;
  solution: string;
  question: string;
}

/** `test-paper/schemas/test-paper-section.schema.ts` */
export interface ITestPaperSectionFields {
  _id: string;
  name: string;
  description?: string;
  sectionType: SectionType;
  sectionCategory?: SectionCategoryType;
  /** Marks per question type, e.g. `{ 'single-choice': { correct: 4, incorrect: -1 } }`. */
  defaultMarkings?: DefaultMarkingType;
  subsections?: string[];
  instruction?: string;
}

/** `course/schemas/completed-module.schema.ts` — a learner's progress on one course item. */
export interface ICompletedModuleFields {
  _id: string;
  course: string;
  courseModule: string;
  collectionItem: string;
  /** Which collection `collectionItem` points at; the schema resolves the ref from it. */
  collectionRef: CollectionType;
  isCompleted?: boolean;
  isSkipped?: boolean;
}

/** No server schema — see the note above. */
export interface ICourseModuleFields {
  _id: string;
  course: string;
  name: string;
  slug?: string;
  description?: string | null;
  day: number;
  materials?: string[];
  testPapers?: string[];
  meets?: string[];
}

/**
 * Marks awarded per outcome for one question, e.g. `{ correct: 4, incorrect: -1 }`.
 *
 * Three keys are required, matching `MarkingSchema` on the server and `MarkingsDto`.
 * `partiallyCorrect` is in the `Marking` enum and used by the exam scoring types, but the question
 * schema does not persist it, so it is optional here rather than required.
 */
export type MarkingType = Record<Exclude<Marking, Marking.PARTIALLY_CORRECT>, number> &
  Partial<Record<Marking.PARTIALLY_CORRECT, number>>;
