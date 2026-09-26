import type { CollectionType } from '../enums/plan.enum';
import type { Marking } from '../enums/test-paper.enum';
import type { QuestionType } from '../enums/question.enum';

/**
 * Client shapes for entities the API serves but has **no validation DTO for**.
 *
 * Everything else a store holds is typed from its DTO in `contracts/` (see decision 1 of the
 * Zustand migration plan). These are the shapes with no DTO of their own, so this is their single
 * declaration rather than a duplicate of one — and it belongs here rather than in an app because
 * teaching and learning both hold them. `ICourseModuleFields` is the one shape here that now has a
 * DTO; see below for why it stays.
 *
 * `IOptionFields`, `ISolutionFields` and `ITestPaperSectionFields` used to live here. Options and
 * solutions are now embedded subdocuments of `QuestionDto`, and a section has a real
 * `TestPaperSectionDto` — so all three are gone rather than duplicated.
 *
 * Each is written from the server's Mongoose schema. `ICourseModuleFields` was the exception while
 * the routes it serves (`course/upsert/course/module`, `course/course/modules/:courseId`) had no
 * schema behind them; they are backed by `CourseModule`
 * (`course/schemas/course-module.schema.ts`) and validated by `CourseModuleDto`, so the shape is
 * reconciled rather than inferred. The interface stays because the learning store holds it, and any
 * change to it belongs in the DTO first.
 */

/** Marks a section applies by default, per question type. */
export type DefaultMarkingType = { [key in QuestionType]: MarkingType };

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
  /** Mongoose's timestamps, present on every stored row; the activity screen orders by them. */
  createdAt?: string;
  updatedAt?: string;
}

/** `course/schemas/course-module.schema.ts`, whose wire shape is `CourseModuleDto`. */
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
 * `partiallyCorrect` is optional rather than required because only some question types award it —
 * the schema and the DTO both accept it, so a value sent for it is persisted.
 */
export type MarkingType = Record<Exclude<Marking, Marking.PARTIALLY_CORRECT>, number> &
  Partial<Record<Marking.PARTIALLY_CORRECT, number>>;
