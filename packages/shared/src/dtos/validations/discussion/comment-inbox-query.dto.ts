import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { CommentInboxStatus } from '../../../enums/discussion.enum';

/** Filters for a teacher's discussion inbox: the comments on every course their organization owns. */
export class CommentInboxQueryDto {
  @IsEnum(CommentInboxStatus)
  status: CommentInboxStatus;

  /** ISO 8601 cursor: comments created before this. Absent for the first page. */
  @IsOptional()
  @IsDateString()
  before?: string;

  @IsOptional()
  @IsMongoId()
  course?: string;

  @IsOptional()
  @IsMongoId()
  material?: string;

  @IsOptional()
  @IsMongoId()
  testPaper?: string;
}
