import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

/** The single field list for a batch, used for both the request body and the response. */
export class BatchDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsMongoId()
  standard?: string;

  @IsNotEmpty()
  @IsNumber()
  year: number;
}
