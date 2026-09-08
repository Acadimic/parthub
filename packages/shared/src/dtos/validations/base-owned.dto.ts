import { IsBoolean, IsDateString, IsMongoId, IsOptional } from 'class-validator';

/**
 * Ownership fields present on every entity's response.
 *
 * They are declared once here and inherited by each entity's DTO, so a single class serves
 * both directions. On a write they are ignored: the change-tracking plugin fills `org`,
 * `createdBy` and `updatedBy` from the request context and Mongoose owns the timestamps,
 * so a value sent by a client is stripped or overwritten rather than trusted.
 */
export class BaseOwnedDto {
  /**
   * Soft delete. A client removes a document by sending `true` on an upsert or update; every
   * read filters these out, so the row stays for auditing but disappears from the API.
   */
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsMongoId()
  org?: string;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;

  /** ISO 8601 */
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  /** ISO 8601 */
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
