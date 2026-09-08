import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class SubjectDto extends BaseOwnedDto {
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
  description?: string | null;

  @IsOptional()
  @IsString()
  logo?: string | null;
}
