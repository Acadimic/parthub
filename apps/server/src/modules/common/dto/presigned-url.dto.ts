import { MAX_UPLOAD_BYTES } from '@repo/shared/utils';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A key is a path of ids and file names: letters, digits, `.`, `_`, `-` and `/`, no `..` segment
 * and no leading slash, so a key can never climb out of its folder.
 */
export const OBJECT_KEY_PATTERN = /^(?!.*(?:^|\/)\.\.(?:\/|$))[\w.\-][\w.\-\/]*$/;
/** `type/subtype` with the characters MIME allows. */
export const CONTENT_TYPE_PATTERN = /^[\w.+-]+\/[\w.+-]+$/;

export class PresignedPutUrlDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Matches(OBJECT_KEY_PATTERN, { message: 'key must be a path of ids and file names, without ".." or a leading slash' })
  key: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  @Matches(CONTENT_TYPE_PATTERN, { message: 'contentType must be a media type such as image/png' })
  contentType: string;

  /** The file's size in bytes, declared so a file over the limit is refused before a URL is signed. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES, { message: 'size must not exceed 50 MB' })
  size?: number;
}

export class PresignedPutUrlsDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedPutUrlDto)
  files: PresignedPutUrlDto[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class PresignedGetUrlsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(512, { each: true })
  @Matches(OBJECT_KEY_PATTERN, { each: true, message: 'each key must be a path without ".." or a leading slash' })
  keys: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class DeleteObjectsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(512, { each: true })
  @Matches(OBJECT_KEY_PATTERN, { each: true, message: 'each key must be a path without ".." or a leading slash' })
  keys: string[];
}
