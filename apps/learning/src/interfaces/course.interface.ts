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
