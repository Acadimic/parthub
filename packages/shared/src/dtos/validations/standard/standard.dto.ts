import { StandardGroup } from '../../../enums';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class StandardDto extends BaseOwnedDto {
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
  description?: string | null;

  @IsOptional()
  @IsString()
  logo?: string | null;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(StandardGroup)
  group?: StandardGroup;

  @IsOptional()
  @IsString()
  alias?: string;

  /** A language track's spoken language, BCP-47 (`es-ES`, `sa`): pronunciation marks start in it. */
  @IsOptional()
  @IsString()
  locale?: string | null;
}
