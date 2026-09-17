import {
  type QuestionDto,
  type StandardDto,
  type StandardSubjectMappingDto,
  type SubjectDto,
  type TestPaperSectionDto,
} from './entity.contract';

/**
 * The `common/initial-data` response — the reference data every app loads once after sign-in.
 *
 * All three apps consume it into their standard store, so the shape belongs here rather than being
 * re-derived per app. The endpoint is `GET common/initial-data` in the server's common module.
 */
export interface InitialDataResponse {
  standards: StandardDto[];
  subjects: SubjectDto[];
  mappings: StandardSubjectMappingDto[];
}

/**
 * The `common/public-data` response — the reference data a visitor sees before signing in.
 *
 * Standards and subjects only: the endpoint is `GET common/public-data` in the server's common
 * module, and it is `@Public()`.
 */
export interface PublicDataResponse {
  standards: StandardDto[];
  subjects: SubjectDto[];
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
