import { type LevelType } from '../enums';

/**
 * The JSON a model returns for the course generator, and the importer reads.
 *
 * A course is a plan of days, each pointing at lessons and tests that either already exist in the
 * workspace (`use`, by id) or are to be generated later (`generate`, a spec). Weeks are how the
 * plan is presented; the database only knows `CourseModule.day`, which the importer numbers across
 * the weeks. Prose fields are plain text, not Markdown: the course card and header show them as
 * they are.
 */
export const AI_COURSE_FORMAT = 'acadimic.course/v1';

export interface IAiLessonSpec {
  name: string;
  level: LevelType;
  topics: string[];
  durationMins: number;
  /** Id from the workspace, when chapters were listed. */
  chapter?: string;
}

export interface IAiTestSpec {
  name: string;
  questionCount: number;
  /** Ids from the workspace. */
  chapters: string[];
  topics: string[];
  durationMins: number;
}

/** An existing lesson or test by id, or a spec for one to generate. */
export type IAiLessonRef = { use: string } | { generate: IAiLessonSpec };
export type IAiTestRef = { use: string } | { generate: IAiTestSpec };

export interface IAiSessionSpec {
  title: string;
  durationMins: number;
  agenda: string[];
}

export interface IAiCourseDay {
  /** Unique within the file, e.g. "W1-D2". */
  ref: string;
  name: string;
  /** One or two sentences shown on the module card. */
  description: string;
  topics: string[];
  estimatedMins: number;
  lessons: IAiLessonRef[];
  tests: IAiTestRef[];
  session?: IAiSessionSpec;
}

export interface IAiCourseWeek {
  /** Unique within the file, e.g. "W1". */
  ref: string;
  theme: string;
  days: IAiCourseDay[];
}

export interface IAiCoursePlan {
  name: string;
  period: 'monthly' | 'yearly';
  amount: number;
  realAmount: number;
  currency: 'INR' | 'USD';
}

export interface IAiCourse {
  format: typeof AI_COURSE_FORMAT;
  /** Minted by the drawer and echoed back, so a reply cannot land on another course. */
  courseId: string;
  standards: string[];
  subjects: string[];
  title: string;
  /** At most 120 characters, for the card. */
  tagline: string;
  /** Plain prose, two to four short paragraphs. */
  description: string;
  /** Five to eight "can do" statements. */
  outcomes: string[];
  prerequisites: string[];
  /** The syllabus the model worked from, one line per topic, in teaching order. */
  outline: string[];
  weeks: IAiCourseWeek[];
  plans: IAiCoursePlan[];
  generatedBy?: string;
}

export type AiPendingKind = 'lesson' | 'test' | 'session';
export type AiPendingStatus = 'pending' | 'prompted' | 'done' | 'skipped';

/**
 * A lesson or test a course module still needs generated.
 *
 * Stored on the module so a teacher can close the drawer, come back later, and see exactly what
 * is left; the content generators consume it and set `createdId` when the item exists.
 */
export interface IAiPendingWork {
  key: string;
  kind: AiPendingKind;
  spec: IAiLessonSpec | IAiTestSpec | IAiSessionSpec;
  status: AiPendingStatus;
  createdId?: string;
}

/** The JSON a model returns for the course review: findings, nothing written. */
export const AI_COURSE_REVIEW_FORMAT = 'acadimic.course-review/v1';

export type AiReviewSeverity = 'error' | 'warning' | 'info';

export interface IAiReviewFinding {
  severity: AiReviewSeverity;
  /** A day ref such as "D3", a week such as "W2", or "course". */
  where: string;
  issue: string;
  suggestion: string;
}

export interface IAiCourseReview {
  format: typeof AI_COURSE_REVIEW_FORMAT;
  courseId: string;
  /** One or two sentences on the course as a whole. */
  summary?: string;
  findings: IAiReviewFinding[];
  generatedBy?: string;
}
