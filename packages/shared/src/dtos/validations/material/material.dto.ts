import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { LevelType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

export class MaterialDto extends BaseOwnedDto {
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

  @IsOptional()
  @IsArray()
  attachments?: Record<string, unknown>[];
}
