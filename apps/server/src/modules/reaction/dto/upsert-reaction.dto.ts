import { CollectionType } from '@parthhub/shared';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertReactionDto {
  @IsNotEmpty()
  @IsMongoId()
  collectionItem: string;

  @IsNotEmpty()
  @IsEnum(CollectionType)
  collectionRef: CollectionType;

  @IsOptional()
  @IsMongoId()
  course?: string;
}
