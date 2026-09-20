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
