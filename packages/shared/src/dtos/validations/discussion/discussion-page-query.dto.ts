import { IsDateString, IsOptional } from 'class-validator';

/** The cursor for the next page of a course's comments or reviews. */
export class DiscussionPageQueryDto {
  /** ISO 8601: rows created before this, as the last page's oldest row gives it. Absent for the first page. */
  @IsOptional()
  @IsDateString()
  before?: string;
}
