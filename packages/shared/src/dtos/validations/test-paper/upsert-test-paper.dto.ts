import { IsBoolean, IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaperCategoryType, PaperType } from '../../../enums/test-paper.enum';

export class UpsertTestPaperDto {
  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  webLink?: string;

  @IsOptional()
  @IsString()
  appLink?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  standards?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  sections?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  mergedTestPapers?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsDateString()
  isLockedDate?: string;

  @IsOptional()
  @IsNumber()
  totalQuestions?: number;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  maxMarks?: number;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(PaperType)
  paperType?: PaperType;

  @IsOptional()
  @IsEnum(PaperCategoryType)
  paperCategory?: PaperCategoryType;
}
