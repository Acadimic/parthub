import { type CourseDto } from '@repo/shared/contracts';
import { LEARN_URL } from '@utils/constants';

/**
 * A course's public address in the learning app, `/courses/<slug>`. `null` without a slug or
 * without `NEXT_PUBLIC_LEARN_URL`; a draft still has one, which opens once it is published.
 */
export const getCoursePublicUrl = (course: Pick<CourseDto, 'slug'>): string | null =>
  LEARN_URL && course.slug ? `${LEARN_URL.replace(/\/$/, '')}/courses/${course.slug}` : null;
