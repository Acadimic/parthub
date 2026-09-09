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
   * The row's id.
   *
   * Typed as required because every persisted row has one and the client mints its own up front
   * (`getObjectId`) before the first save, so anything a store holds has an `_id`. Validated as
   * *optional* because the mapping upserts key off a natural pair instead — `MappingService`
   * posts `{ user, batch }` with no id and the server upserts on `{ user, batch, org }`. Marking
   * it `@IsNotEmpty()` would 400 that route. Entities that genuinely require an id on the wire
   * re-declare it with `@IsNotEmpty()`.
   */
  @IsOptional()
  @IsMongoId()
  _id: string;

  /**
   * True while the row exists only on the client and has never been saved.
   *
   * Client-only: `CLIENT_ONLY_KEYS` in `@repo/ui/lib` strips it from every request body, so the
   * server never actually receives it. It is declared here anyway because one type now serves both
   * directions — the stores hold this DTO directly rather than a wrapper — and the global
   * `ValidationPipe` runs with `forbidNonWhitelisted`, which would reject the field outright if a
   * caller ever did send it. Nothing server-side reads it, and no schema persists it.
   */
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  /**
   * Soft delete. A client removes a document by sending `true` on an upsert or update; every
   * read filters these out, so the row stays for auditing but disappears from the API.
   */
  @IsOptional()
  @IsBoolean()
  _deleted?: boolean;

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
