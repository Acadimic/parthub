import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LevelType } from '../../../enums';
import { QuestionType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

export class MarkingsDto {
  @IsNumber()
  correct: number;

  @IsNumber()
  incorrect: number;

  @IsNumber()
  unattempted: number;
}

export class QuestionDto extends BaseOwnedDto {
  @IsMongoId()
  _id: string;

  @IsString()
  question: string;

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
  @IsMongoId()
  material?: string;

  @IsOptional()
  @IsMongoId()
  section?: string;

  @IsOptional()
  @IsMongoId()
  subsection?: string;

  @IsOptional()
  @IsMongoId()
  testPaper?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  marks?: number;

  @IsOptional()
  @IsMongoId({ each: true })
  options?: string[];

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @IsOptional()
  @IsEnum(LevelType)
  level?: LevelType;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MarkingsDto)
  markings?: MarkingsDto;
}
