import { CourseService } from '@services';
import { useCourseStore } from '@stores';

/**
 * Recomputes a course's roll-up from what its modules now link and saves it, so the header's
 * counts follow an import or a scheduling run rather than waiting for the next hand edit.
 */
export const persistCourseStats = async (courseId: string): Promise<void> => {
  const store = useCourseStore.getState();
  store.calculateAndSetCourseStatsByCourseId(courseId);
  const course = store.getCourseById(courseId);
  if (!course) return;
  const saved = await CourseService.upsertCourse(course);
  if (saved?.data) store.addCourses([saved.data]);
};
