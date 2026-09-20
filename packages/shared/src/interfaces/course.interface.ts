export interface ICourseBase {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
}

/** The body of `POST course/link-module`; see `LinkCourseModuleDto`. */
export interface ILinkCourseModule {
  courseModule: string;
  materials?: string[];
  testPapers?: string[];
  meets?: string[];
  done?: { key: string; createdId?: string }[];
}
