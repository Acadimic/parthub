import type { IOptionFields, ISolutionFields, ITestPaperSectionFields } from '../interfaces/entity.interface';
import { type QuestionDto, type StandardDto, type StandardSubjectMappingDto, type SubjectDto } from './entity.contract';

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
 * The response the apps expect from `test-paper/sections-with-questions/:testPaperId`: a paper's
 * sections plus everything they contain, in one round trip.
 *
 * **The server has no such route.** `TestPaperController` exposes only `GET test-paper/all` and
 * `GET test-paper/:id`, and `:id` matches a single segment so it cannot serve this path either — the
 * call 404s today. The shape is declared here because the client is written against it; either add
 * the route or change the client to compose the data from routes that exist.
 */
export interface TestPaperSectionsResponse {
  sections: ITestPaperSectionFields[];
  questions: QuestionDto[];
  options: IOptionFields[];
  solutions: ISolutionFields[];
}
