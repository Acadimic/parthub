import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * The wire shape of the server's `CourseContent` schema
 * (`apps/server/src/modules/course/schemas/course-content.schema.ts`), which the apps call a
 * "course module".
 *
 * The two names describe the same document: the collection was named for the content a course day
 * holds, and the apps for the unit a learner works through. Nothing translates between them, so the
 * DTO carries the schema's field list unchanged and only the name differs.
 */
export class CourseModuleDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  day: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  testPapers?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  meets?: string[];
}
