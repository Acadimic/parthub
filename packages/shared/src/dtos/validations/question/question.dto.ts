import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LevelType, QuestionType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';
import { RichTextDto } from '../rich-text.dto';

export class MarkingsDto {
  @IsNumber()
  correct: number;

  @IsNumber()
  incorrect: number;

  @IsNumber()
  unattempted: number;

  // The apps' default marking tables carry this key for every question type, and the global
  // `forbidNonWhitelisted` pipe was rejecting every question save with
  // "markings.property partiallyCorrect should not exist".
  @IsOptional()
  @IsNumber()
  partiallyCorrect?: number;
}

/**
 * One answer option, embedded in its question.
 *
 * An option has no identity outside the question, no lifecycle of its own and is never read without
 * it, so it is a subdocument rather than a collection. It keeps an `_id` because the UI needs a
 * stable key while editing.
 */
export class OptionDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ValidateNested()
  @Type(() => RichTextDto)
  body: RichTextDto;

  @IsBoolean()
  isCorrect: boolean;
}

/** The worked answer, embedded in its question for the same reasons as `OptionDto`. */
export class SolutionDto {
  @ValidateNested()
  @Type(() => RichTextDto)
  body: RichTextDto;
}

export class QuestionDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ValidateNested()
  @Type(() => RichTextDto)
  body: RichTextDto;

  /**
   * The section this question sits in — **always the top-level one**, even when `subsection` is
   * also set. That is what lets a paper's questions load in one query keyed on the paper's own
   * `sections[]`, subsection questions included.
   */
  @IsNotEmpty()
  @IsMongoId()
  section: string;

  /** Set in addition to `section`, and only when the question sits inside a nested subsection. */
  @IsOptional()
  @IsMongoId()
  subsection?: string;

  /** Position within `subsection` when set, otherwise within `section`. */
  @IsNumber()
  order: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SolutionDto)
  solution?: SolutionDto;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  /** The mark value lives here — `markings.correct` is what a paper's `maxMarks` sums. */
  @IsOptional()
  @ValidateNested()
  @Type(() => MarkingsDto)
  markings?: MarkingsDto;

  @IsOptional()
  @IsMongoId()
  standard?: string;

  @IsOptional()
  @IsMongoId()
  subject?: string;

  @IsOptional()
  @IsMongoId()
  chapter?: string;

  @IsOptional()
  @IsEnum(LevelType)
  level?: LevelType;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  year?: number;
}
