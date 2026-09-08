import { IsMongoId, IsNotEmpty } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class StudentStandardMappingDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  student: string;

  @IsNotEmpty()
  @IsMongoId()
  standard: string;
}
