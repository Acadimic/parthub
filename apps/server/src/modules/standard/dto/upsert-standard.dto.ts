import { StandardGroup } from '@parthhub/shared';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertStandardDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(StandardGroup)
  group?: StandardGroup;

  @IsOptional()
  @IsString()
  alias?: string;
}
