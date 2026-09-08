import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class ChapterDto extends BaseOwnedDto {
  @IsNotEmpty()
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
