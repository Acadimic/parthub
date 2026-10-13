import { type CourseDto } from '@repo/shared/contracts';
import { type ICourseModuleItem } from '@interfaces';

/**
 * How many items a learner completes in a course: its lessons and its tests. Videos are attached to
 * lessons rather than items of their own, so `videosCount` is not part of it.
 */
export const getCourseItemsCount = (course: Pick<CourseDto, 'stats'>) =>
  (course.stats?.readingsCount ?? 0) + (course.stats?.testsCount ?? 0);

/** The item's display name, whichever kind it is. */
export const getItemName = (item: ICourseModuleItem) => item.material?.name ?? item.testPaper?.name ?? '';

/** What a move past an edge reads: the neighbouring item's name, or the course's edge. */
export const getEdgeLabel = (item: ICourseModuleItem | undefined, prefix: string, atEdge: string) =>
  item ? `${prefix}: ${getItemName(item)}` : atEdge;
