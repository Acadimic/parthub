import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class SubjectDto extends BaseOwnedDto {
  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
