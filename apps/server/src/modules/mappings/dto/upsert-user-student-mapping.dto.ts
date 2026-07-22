import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpsertUserStudentMappingDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  student: string;
}
