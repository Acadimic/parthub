import { IsArray, IsBoolean, IsDateString, IsMongoId, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertCourseDto {
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
  thumbnail?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  standards?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  courses?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  meets?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  attachments?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  stats?: Record<string, unknown>;
}
