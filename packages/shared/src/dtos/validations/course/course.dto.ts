import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttachmentDto } from '../attachment.dto';
import { BaseOwnedDto } from '../base-owned.dto';
import { PlanDto } from '../plan/plan.dto';

/** Rolled-up counts the apps show on a course card. Server-computed. */
export class CourseStatsDto {
  @IsNumber() daysCount: number;
  @IsNumber() videosCount: number;
  @IsNumber() readingsCount: number;
  @IsNumber() testsCount: number;
  @IsNumber() meetsCount: number;
  @IsNumber() testsDurationMins: number;
  @IsNumber() materialsDurationMins: number;
  @IsNumber() meetsDurationMins: number;
}

/**
 * The single field list for a course, used for both the request body and the response.
 *
 * Ownership fields come from `BaseOwnedDto` and are ignored on write: the change-tracking
 * plugin stamps them from the request context, so anything a client sends is overwritten.
 */
export class CourseDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  /** ISO 8601 */
  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  standards?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  courses?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  meets?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CourseStatsDto)
  stats?: CourseStatsDto;
}

/**
 * A course and its plans, saved in one request.
 *
 * The teaching app edits the two together, and a course with no plan is not sellable — so the pair
 * travels as one body rather than two calls the client would have to sequence and unwind on a
 * partial failure. The server has no transactions, so the write is still two upserts; both are
 * idempotent on their client-minted `_id`, which is what makes a retry safe.
 */
export class CourseWithPlansDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CourseDto)
  course: CourseDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanDto)
  plans: PlanDto[];
}
