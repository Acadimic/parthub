import { type CourseDto } from '@repo/shared/contracts';

/**
 * How many items a learner completes in a course: its lessons and its tests. Videos are attached to
 * lessons rather than items of their own, so `videosCount` is not part of it.
 */
export const getCourseItemsCount = (course: Pick<CourseDto, 'stats'>) =>
  (course.stats?.readingsCount ?? 0) + (course.stats?.testsCount ?? 0);
