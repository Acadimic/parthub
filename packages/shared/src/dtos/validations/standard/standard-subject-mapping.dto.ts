import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class StandardSubjectMappingDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  subject: string;

  @IsNotEmpty()
  @IsMongoId()
  standard: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  referenceStandards?: string[];
}
