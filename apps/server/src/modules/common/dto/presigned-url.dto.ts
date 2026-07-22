import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PresignedPutUrlDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;
}

export class PresignedPutUrlsDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedPutUrlDto)
  files: PresignedPutUrlDto[];

  @IsOptional()
  isPublic?: boolean;
}

export class PresignedGetUrlsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  keys: string[];

  @IsOptional()
  isPublic?: boolean;
}
