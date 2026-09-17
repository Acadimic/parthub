import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SectionCategoryType, SectionType } from '../../../enums';
import type { DefaultMarkingType } from '../../../interfaces';
import { BaseOwnedDto } from '../base-owned.dto';
import { RichTextDto } from '../rich-text.dto';

/**
 * A section of a test paper — and the unit of reuse.
 *
 * A section is referenced by `TestPaper.sections[]` and may be referenced by **several** papers at
 * once, which `mergeTestPapers` already relies on. Questions point *at* a section rather than being
 * listed on it, so a section carries no question array; see `QuestionDto.section`.
 */
export class TestPaperSectionDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  name: string;

  @IsEnum(SectionType)
  sectionType: SectionType;

  @IsOptional()
  @IsEnum(SectionCategoryType)
  sectionCategory?: SectionCategoryType;

  @IsOptional()
  @ValidateNested()
  @Type(() => RichTextDto)
  description?: RichTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RichTextDto)
  instruction?: RichTextDto;

  /**
   * Marks applied to a question of a given type when it does not carry its own `markings`.
   *
   * Validated as an object rather than a class per question type: the keys are the `QuestionType`
   * enum, so a class would have to restate it and would drift the moment a type is added. The
   * Mongoose schema derives its own shape from the same enum and validates each entry there.
   */
  @IsOptional()
  @IsObject()
  defaultMarkings?: DefaultMarkingType;

  /** Nested sections, ordered by array position. */
  @IsOptional()
  @IsMongoId({ each: true })
  subsections?: string[];
}
