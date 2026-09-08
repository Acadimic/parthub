import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class ChapterDto extends BaseOwnedDto {
  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsMongoId()
  standard: string;

  @IsMongoId()
  subject: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class StandardSubjectQueryDto {
  @IsMongoId()
  standard: string;

  @IsMongoId()
  subject: string;
}
