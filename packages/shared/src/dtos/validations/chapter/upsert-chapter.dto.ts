import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertChapterDto {
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
