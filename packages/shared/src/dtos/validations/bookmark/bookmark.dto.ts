import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { CollectionType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

/** The single field list for a bookmark, used for both the request body and the response. */
export class BookmarkDto extends BaseOwnedDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

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
