// Single field lists live in the validation DTOs. Re-exported as types only, so no validator
// code reaches the apps. The shape is the DTO as declared — ownership fields optional — because
// this one type is also what the client stores hold, drafts included.

export type { BatchDto } from '../dtos/validations/batch/batch.dto';
export type { BookmarkDto } from '../dtos/validations/bookmark/bookmark.dto';
export type { FollowerDto } from '../dtos/validations/follower/follower.dto';
export type { ReactionDto } from '../dtos/validations/reaction/reaction.dto';
export type { ChapterDto } from '../dtos/validations/chapter/chapter.dto';
export type { MaterialDto } from '../dtos/validations/material/material.dto';
export type { QuestionDto } from '../dtos/validations/question/question.dto';
export type { OptionDto } from '../dtos/validations/question/question.dto';
export type { SolutionDto } from '../dtos/validations/question/question.dto';
export type { MarkingsDto } from '../dtos/validations/question/question.dto';
export type { SubjectDto } from '../dtos/validations/subject/subject.dto';
export type { TestPaperDto } from '../dtos/validations/test-paper/test-paper.dto';
export type { TestPaperSectionDto } from '../dtos/validations/test-paper/test-paper-section.dto';
export type { MeetDto } from '../dtos/validations/meet/meet.dto';
export type { PlanDto } from '../dtos/validations/plan/plan.dto';
export type { StandardDto } from '../dtos/validations/standard/standard.dto';
export type { StandardSubjectMappingDto } from '../dtos/validations/standard/standard-subject-mapping.dto';
export type { StandardIdsQueryDto } from '../dtos/validations/standard/standard-ids-query.dto';
export type { StudentStandardMappingDto } from '../dtos/validations/mappings/student-standard-mapping.dto';
export type { UserBatchMappingDto } from '../dtos/validations/mappings/user-batch-mapping.dto';
export type { UserStudentMappingDto } from '../dtos/validations/mappings/user-student-mapping.dto';
export type { CourseDto } from '../dtos/validations/course/course.dto';
export type { CourseStatsDto } from '../dtos/validations/course/course.dto';
export type { CourseWithPlansDto } from '../dtos/validations/course/course.dto';
export type { CourseModuleDto } from '../dtos/validations/course/course-module.dto';
export type { AttachmentDto } from '../dtos/validations/attachment.dto';
export type { RichTextDto } from '../dtos/validations/rich-text.dto';

// These five declare their own complete field lists rather than extending BaseOwnedDto, so they
// are re-exported as-is. Wrapping them in ResponseOf would add org, createdBy, updatedBy,
// createdAt, updatedAt and _deleted as *required*, which the server does not send for them —
// UserDto declares its own `org` and nothing else from that set.
export type { UserDto } from '../dtos/validations/user/user.dto';
export type { OrgDto } from '../dtos/validations/user/user.dto';
export type { InitialDataDto } from '../dtos/validations/user/user.dto';
export type { InviteDto } from '../dtos/validations/invite/invite.dto';
