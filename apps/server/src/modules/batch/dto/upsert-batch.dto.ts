import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertBatchDto {
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
