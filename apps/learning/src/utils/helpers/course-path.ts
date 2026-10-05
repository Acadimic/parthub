import { type CourseDto } from '@repo/shared/contracts';

/**
 * A course's public address: `/courses/<slug>`, which the share button, every link, the sitemap
 * and Google use. A course with no slug (one not saved since the teaching app began setting them)
 * uses its id address, `/courses/<id>/preview`, which stays a working page of its own.
 */
export const getCoursePath = (course: Pick<CourseDto, '_id' | 'slug'>) =>
  course.slug ? `/courses/${course.slug}` : `/courses/${course._id}/preview`;
