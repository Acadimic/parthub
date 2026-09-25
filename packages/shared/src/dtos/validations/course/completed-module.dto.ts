import { CollectionType } from '../../../enums';
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * A learner's progress on one item inside a course module, backed by
 * `course/schemas/completed-module.schema.ts`.
 *
 * `_id` is `@IsNotEmpty()` because the client mints it before the first save, which is what makes
 * the write an idempotent upsert rather than a create.
 */
export class CompletedModuleDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsNotEmpty()
  @IsMongoId()
  courseModule: string;

  @IsNotEmpty()
  @IsMongoId()
  collectionItem: string;

  /** Which collection `collectionItem` points at; the schema resolves its ref from this. */
  @IsNotEmpty()
  @IsEnum(CollectionType)
  collectionRef: CollectionType;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isSkipped?: boolean;
}
