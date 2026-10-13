import { type AttachmentDto } from '@repo/shared/contracts';
import { type IRichText } from '@repo/shared/interfaces';
import { type IMaterial, type ITestPaper } from '@stores';

export interface ICourseModuleItem {
  courseId: string;
  courseModuleId: string;
  material?: IMaterial;
  testPaper?: ITestPaper;
}

export interface IGetCompletedModule {
  course: string;
  courseModule: string;
  collectionItem: string;
}

/**
 * The catalogue's filters, as the learner has set them.
 *
 * An empty list means that field is not filtering — not that nothing matches — so the initial
 * state and "cleared" are the same value.
 */
export interface ICourseFilter {
  standards: string[];
  subjects: string[];
}

/** The standard and subject ids each filter may offer. */
export interface ICourseFilterOptions {
  standards: string[];
  subjects: string[];
}

/** How far a learner is through a course, counted over its materials and test papers. */
export interface ICourseProgress {
  completed: number;
  total: number;
  /** 0–100, and 0 for a course with no items. */
  percent: number;
}

/**
 * One page of a lesson in the topic reader: a slice of the body cut at a heading, or an attachment.
 * `key` is what the viewed-pages record holds, so it must be stable across reloads: a section's
 * position, or an attachment's object key.
 */
export type ILessonPage =
  | { kind: 'section'; key: string; title: string; parentTitle: string; content: IRichText }
  | { kind: 'attachment'; key: string; title: string; attachment: AttachmentDto };
