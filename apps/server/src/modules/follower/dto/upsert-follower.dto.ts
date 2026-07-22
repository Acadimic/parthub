import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpsertFollowerDto {
  @IsNotEmpty()
  @IsMongoId()
  following: string;
}
