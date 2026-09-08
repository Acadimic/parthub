import { BaseFields } from './base.contract';
import { AttachmentDto } from './material.contract';

/** Rolled-up counts and durations the apps display on a course card. */
export interface CourseStatsDto {
  daysCount: number;
  videosCount: number;
  readingsCount: number;
  testsCount: number;
  meetsCount: number;
  testsDurationMins: number;
  materialsDurationMins: number;
  meetsDurationMins: number;
}

export interface CourseDto extends BaseFields {
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  status?: string;
  tag?: string;
  order?: number;
  isPublished: boolean;
  /** ISO 8601 */
  publishedDate?: string;
  standards: string[];
  subjects: string[];
  courses: string[];
  meets: string[];
  attachments: AttachmentDto[];
  stats?: CourseStatsDto;
}
