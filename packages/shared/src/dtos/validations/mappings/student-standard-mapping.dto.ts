import { IsDateString, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

export class StudentStandardMappingDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  student: string;

  @IsNotEmpty()
  @IsMongoId()
  standard: string;

  /**
   * When the student was enrolled on this standard. ISO 8601.
   *
   * Server-assigned: `StudentStandardMappingService` sets it with `$setOnInsert`, so it is never
   * required on a write, and a value a client sends on an existing row is ignored.
   */
  @IsOptional()
  @IsDateString()
  enrolledAt?: string;
}
