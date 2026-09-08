import { IsMongoId, IsNotEmpty } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class UserStudentMappingDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  student: string;
}
