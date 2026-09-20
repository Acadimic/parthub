export interface ICourseBase {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
}

/** The body of `POST course/link-content`; see `LinkCourseContentDto`. */
export interface ILinkCourseContent {
  courseModule: string;
  materials?: string[];
  testPapers?: string[];
  meets?: string[];
  done?: { key: string; createdId?: string }[];
}
