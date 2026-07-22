import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpsertUserBatchMappingDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  batch: string;
}
