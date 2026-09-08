// Single field lists live in the validation DTOs. Types only, so no validator code reaches the
// apps, wrapped in ResponseOf so ownership fields are required on the way out.
import type { ResponseOf } from './base.contract';

import type { BatchDto as BatchDtoFields } from '../dtos/validations/batch/batch.dto';
import type { BookmarkDto as BookmarkDtoFields } from '../dtos/validations/bookmark/bookmark.dto';
import type { FollowerDto as FollowerDtoFields } from '../dtos/validations/follower/follower.dto';
import type { ReactionDto as ReactionDtoFields } from '../dtos/validations/reaction/reaction.dto';
import type { ChapterDto as ChapterDtoFields } from '../dtos/validations/chapter/chapter.dto';
import type { MaterialDto as MaterialDtoFields } from '../dtos/validations/material/material.dto';
import type { QuestionDto as QuestionDtoFields } from '../dtos/validations/question/question.dto';
import type { SubjectDto as SubjectDtoFields } from '../dtos/validations/subject/subject.dto';
import type { TestPaperDto as TestPaperDtoFields } from '../dtos/validations/test-paper/test-paper.dto';
import type { MeetDto as MeetDtoFields } from '../dtos/validations/meet/meet.dto';
import type { PlanDto as PlanDtoFields } from '../dtos/validations/plan/plan.dto';
import type { StandardDto as StandardDtoFields } from '../dtos/validations/standard/standard.dto';
import type { StandardSubjectMappingDto as StandardSubjectMappingDtoFields } from '../dtos/validations/standard/standard-subject-mapping.dto';
import type { StudentStandardMappingDto as StudentStandardMappingDtoFields } from '../dtos/validations/mappings/student-standard-mapping.dto';
import type { UserBatchMappingDto as UserBatchMappingDtoFields } from '../dtos/validations/mappings/user-batch-mapping.dto';
import type { UserStudentMappingDto as UserStudentMappingDtoFields } from '../dtos/validations/mappings/user-student-mapping.dto';

export type BatchDto = ResponseOf<BatchDtoFields>;
export type BookmarkDto = ResponseOf<BookmarkDtoFields>;
export type FollowerDto = ResponseOf<FollowerDtoFields>;
export type ReactionDto = ResponseOf<ReactionDtoFields>;
export type ChapterDto = ResponseOf<ChapterDtoFields>;
export type MaterialDto = ResponseOf<MaterialDtoFields>;
export type QuestionDto = ResponseOf<QuestionDtoFields>;
export type SubjectDto = ResponseOf<SubjectDtoFields>;
export type TestPaperDto = ResponseOf<TestPaperDtoFields>;
export type MeetDto = ResponseOf<MeetDtoFields>;
export type PlanDto = ResponseOf<PlanDtoFields>;
export type StandardDto = ResponseOf<StandardDtoFields>;
export type StandardSubjectMappingDto = ResponseOf<StandardSubjectMappingDtoFields>;
export type StudentStandardMappingDto = ResponseOf<StudentStandardMappingDtoFields>;
export type UserBatchMappingDto = ResponseOf<UserBatchMappingDtoFields>;
export type UserStudentMappingDto = ResponseOf<UserStudentMappingDtoFields>;
