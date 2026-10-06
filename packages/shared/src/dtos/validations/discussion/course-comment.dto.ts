import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DISCUSSION_LIMITS } from '../../../utils/discussion.util';
import { AttachmentDto } from '../attachment.dto';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * The single field list for a comment in a course's discussion, used for both the request body and
 * the response. A comment with a `parent` is a reply; replies are one level deep, so a reply's
 * parent is always a top-level comment. A comment needs text or an attachment, which the server
 * checks because neither field alone is required.
 */
export class CourseCommentDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsOptional()
  @IsMongoId()
  parent?: string | null;

  /**
   * Where the author was in the course when they wrote it: the module, and the lesson or test paper
   * open in it. Null when nothing was open. Fixed when the comment is created.
   */
  @IsOptional()
  @IsMongoId()
  courseModule?: string | null;

  @IsOptional()
  @IsMongoId()
  material?: string | null;

  @IsOptional()
  @IsMongoId()
  testPaper?: string | null;

  @IsString()
  @MaxLength(DISCUSSION_LIMITS.MAX_BODY_LENGTH)
  body: string;

  @IsArray()
  @ArrayMaxSize(DISCUSSION_LIMITS.MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];

  /**
   * Response-only. Written by staff of the organization that owns the course, shown with the
   * "Teacher" badge and the reason a thread counts as answered. Ignored on a write.
   */
  @IsOptional()
  @IsBoolean()
  isStaff?: boolean;

  /** Response-only, on a top-level comment: whether staff have replied to it. Ignored on a write. */
  @IsOptional()
  @IsBoolean()
  isAnswered?: boolean;

  /** Response-only. ISO 8601: when the author last changed it, or null if never. Ignored on a write. */
  @IsOptional()
  @IsDateString()
  editedAt?: string | null;
}
