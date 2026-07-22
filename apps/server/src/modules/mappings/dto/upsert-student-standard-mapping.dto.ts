import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpsertStudentStandardMappingDto {
  @IsNotEmpty()
  @IsMongoId()
  student: string;

  @IsNotEmpty()
  @IsMongoId()
  standard: string;
}
