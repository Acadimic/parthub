import { IsMongoId, IsNotEmpty } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class UserBatchMappingDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  batch: string;
}
