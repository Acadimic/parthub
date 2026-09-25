import { BlankState } from '@components/others';
import { useCourse } from '@hooks/course.hook';
import { useCourseLookups, useSelectedCourse, useSelectedUser, useSelectorLookups } from '@stores';
import { useEffect, useState } from 'react';
import { CourseModules, CourseModulesSkeleton, CoursePreview, CoursePreviewSkeleton } from './components';

interface IProps {
  courseId: string;
  isPreview: boolean;
}

export const Course = ({ courseId, isPreview }: IProps) => {
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { loadCourseModules, loadCourses, loadCompletedModules, getCourseById } = courseStore;
  const { setSelectedCourseId } = selectorStore;
  const { getSelectedItemIndex, selectResumeItem } = useCourse();
  const selectedCourse = useSelectedCourse();
  const selectedUser = useSelectedUser();
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourseData = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    // The course list has to land before the modules load: `loadCourseModules` reads the course
    // back out of the store and returns early when it is not there yet.
    if (!getCourseById(courseId)) await loadCourses();
    const course = getCourseById(courseId);
    await Promise.all([
      course?.isLoadedContents ? Promise.resolve() : loadCourseModules(courseId),
      selectedUser.isLoadedCompletedModules ? Promise.resolve() : loadCompletedModules(),
    ]);
    setSelectedCourseId(courseId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId, selectedUser?._id]);

  // The learning view needs an item on screen. After a fresh load — a hard refresh, a shared link —
  // nothing is selected, so it opens on the first lesson the learner has not finished.
  useEffect(() => {
    if (isLoading || isPreview || !selectedCourse) return;
    if (getSelectedItemIndex(courseId) === -1) selectResumeItem(courseId);
  }, [isLoading, isPreview, selectedCourse?._id]);

  if (isLoading) return isPreview ? <CoursePreviewSkeleton /> : <CourseModulesSkeleton />;
  if (!selectedCourse) {
    return (
      <BlankState
        className="py-24"
        label="Course not found"
        description="It may have been unpublished, or the link is no longer valid."
      />
    );
  }
  return isPreview ? <CoursePreview /> : <CourseModules />;
};
