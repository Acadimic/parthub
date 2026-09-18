import { IsArray, IsMongoId } from 'class-validator';

/**
 * The body for "give me the rows for these standards".
 *
 * A body rather than a query string because the list is unbounded — a teacher may hold every
 * standard the organization offers — and because the global `ValidationPipe` only validates a body
 * whose metatype is a class, so a DTO is what gets the ids checked at all.
 */
export class StandardIdsQueryDto {
  @IsArray()
  @IsMongoId({ each: true })
  standards: string[];
}
