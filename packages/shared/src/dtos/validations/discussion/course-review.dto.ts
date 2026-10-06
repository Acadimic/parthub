import { IsInt, IsMongoId, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { DISCUSSION_LIMITS } from '../../../utils/discussion.util';
import { BaseOwnedDto } from '../base-owned.dto';

/** The single field list for a learner's review of a course: one per learner per course. */
export class CourseReviewDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(DISCUSSION_LIMITS.MAX_BODY_LENGTH)
  body: string;
}
