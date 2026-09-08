import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { CollectionType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

/** The single field list for a reaction, used for both the request body and the response. */
export class ReactionDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

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
