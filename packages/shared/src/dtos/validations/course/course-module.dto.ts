import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  type AiPendingKind,
  type AiPendingStatus,
  type IAiLessonSpec,
  type IAiSessionSpec,
  type IAiTestSpec,
} from '../../../interfaces';
import { BaseOwnedDto } from '../base-owned.dto';

/** A lesson or test the AI course generator still owes a module; see `IAiPendingWork`. */
export class PendingWorkDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsIn(['lesson', 'test', 'session'])
  kind: AiPendingKind;

  /** The generate spec from the course reply; shape depends on `kind`, so validated as an object. */
  @IsObject()
  spec: IAiLessonSpec | IAiTestSpec | IAiSessionSpec;

  @IsIn(['pending', 'prompted', 'done', 'skipped'])
  status: AiPendingStatus;

  @IsOptional()
  @IsMongoId()
  createdId?: string;
}

/**
 * The wire shape of the server's `CourseModule` schema
 * (`apps/server/src/modules/course/schemas/course-module.schema.ts`).
 *
 * The schema was `CourseContent` until the apps' name won: the collection had been named for the
 * content a course day holds, the apps for the unit a learner works through. Nothing translated
 * between them, so the DTO carries the schema's field list unchanged.
 */
export class CourseModuleDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  day: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  testPapers?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  meets?: string[];

  /** The topics the day covers, shown on the card and read by the course review. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  /** The week the day belongs to, so the course grid need not re-derive it from `day`. */
  @IsOptional()
  @IsNumber()
  week?: number;

  /** Lessons and tests the AI generator has yet to produce for this module. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PendingWorkDto)
  pending?: PendingWorkDto[];
}

/** `POST course/upsert/course/modules`: a generated course's modules in one request. */
export class BulkUpsertCourseModulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(120)
  @ValidateNested({ each: true })
  @Type(() => CourseModuleDto)
  modules: CourseModuleDto[];
}

/** One pending item settled: which key, and what now exists for it. */
export class PendingDoneDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsOptional()
  @IsMongoId()
  createdId?: string;
}

/**
 * `POST course/link-module`: appends generated content to a module and settles the pending items it
 * fulfils. A small idempotent write, so linking never re-sends the whole module and cannot race
 * with an edit of its name.
 */
export class LinkCourseModuleDto {
  @IsNotEmpty()
  @IsMongoId()
  courseModule: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  testPapers?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  meets?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PendingDoneDto)
  done?: PendingDoneDto[];
}
