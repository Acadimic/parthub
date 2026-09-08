import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LevelType } from '../../../enums';
import { Type } from 'class-transformer';
import { AttachmentDto } from '../attachment.dto';
import { BaseOwnedDto } from '../base-owned.dto';

export class MaterialDto extends BaseOwnedDto {
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
  content?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  url?: string;

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
  course?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsOptional()
  @IsEnum(LevelType)
  level?: LevelType;

  /**
   * Files and links on the material. The server stores these as `Attachment` subdocuments
   * (`material.schema.ts`), and `CourseDto` already declares the same field as `AttachmentDto[]`;
   * this was `Record<string, unknown>[]`, which let any shape through and gave the apps nothing to
   * typecheck against.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
