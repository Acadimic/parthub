import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * The single field list for a follow relationship.
 *
 * `follower` is server-owned: it is always the signed-in user, so a value sent by a client
 * is ignored rather than trusted.
 */
export class FollowerDto extends BaseOwnedDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsOptional()
  @IsMongoId()
  follower?: string;

  @IsNotEmpty()
  @IsMongoId()
  following: string;
}
