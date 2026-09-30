import {
  type CourseDto,
  type QuestionDto,
  type StandardDto,
  type StandardSubjectMappingDto,
  type SubjectDto,
  type TestPaperSectionDto,
} from './entity.contract';
import { type IPresignedUrl } from './presigned-url.contract';

/**
 * The `common/private-initial-data` response — the platform catalogue the support app loads through
 * the private API key. `PublicDataResponse` is the same data for every other caller.
 */
export interface InitialDataResponse {
  standards: StandardDto[];
  subjects: SubjectDto[];
  mappings: StandardSubjectMappingDto[];
}

/**
 * The `common/public-data` response: the platform catalogue every app loads, signed in or not.
 * `GET common/public-data` in the server's common module, `@Public()`.
 *
 * `presignedUrls` signs the standards' and subjects' logos for a caller that cannot sign them
 * itself; it is filled only for `?signed=true`, which the learning app sends without a session,
 * and is an empty array otherwise. Each `key` is the logo's stored address.
 */
export interface PublicDataResponse {
  standards: StandardDto[];
  subjects: SubjectDto[];
  mappings: StandardSubjectMappingDto[];
  presignedUrls: IPresignedUrl[];
}

/**
 * The `course/published` response: the public catalogue of published courses. `presignedUrls`
 * signs every course image (its `attachments`) under the same `?signed=true` rule as
 * `PublicDataResponse`.
 */
export interface PublishedCoursesResponse {
  courses: CourseDto[];
  presignedUrls: IPresignedUrl[];
}

/**
 * The response for `GET test-paper/sections-with-questions/:testPaperId`: a paper's sections plus
 * their questions, in one round trip.
 *
 * Two arrays rather than four. Options and solutions are embedded subdocuments of a question now,
 * so they arrive inside `questions` and have no top-level array of their own. Questions carry
 * `section` and `order`, so the client groups and sorts from those rather than from nesting.
 */
export interface TestPaperSectionsResponse {
  sections: TestPaperSectionDto[];
  questions: QuestionDto[];
}
