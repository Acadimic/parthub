// The single field list lives in the validation DTO. Re-exported here as a type only, so the apps
// get the shape without class-validator reaching their bundle, and wrapped in ResponseOf so the
// ownership fields are required on the way out.
import type { CourseDto as CourseFields } from '../dtos/validations/course/course.dto';
import type { ResponseOf } from './base.contract';

export type CourseDto = ResponseOf<CourseFields>;
export type { CourseStatsDto } from '../dtos/validations/course/course.dto';
