import { IMaterial, ITestPaper } from '@stores';

export interface ICourseContentItem {
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
