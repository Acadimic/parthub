import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttachmentDto } from '../attachment.dto';
import { BaseOwnedDto } from '../base-owned.dto';

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
