import { FullScreenLoader } from '@repo/ui/app';
import { useCourseLookups, useSelectedCourse, useSelectedUser, useSelectorLookups } from '@stores';
import { useEffect, useState } from 'react';
import { CourseModules, CoursePreview } from './components';

interface IProps {
  courseId: string;
  isPreview: boolean;
}

export const Course = ({ courseId, isPreview }: IProps) => {
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { loadCourseModules, loadCourses, loadCompletedModules } = courseStore;
  const { setSelectedCourseId } = selectorStore;
  const selectedCourse = useSelectedCourse();
  const selectedUser = useSelectedUser();
  const [isLoading, setIsLoading] = useState(false);

  const fetchCourseData = async () => {
    if (isLoading || !selectedUser) return;
    setIsLoading(true);
    // The course list has to land before the modules load: `loadCourseModules` reads the course
    // back out of the store and returns early when it is not there yet. These used to be three
    // `const promise = ...` bindings awaited further down, which starts all three at once — the
    // modules fetch then found no course and silently skipped, so the page showed "No Module".
    if (!selectedCourse) await loadCourses();
    await Promise.all([
      selectedCourse?.isLoadedContents ? Promise.resolve() : loadCourseModules(courseId),
      selectedUser?.isLoadedCompletedModules ? Promise.resolve() : loadCompletedModules(),
    ]);
    setSelectedCourseId(courseId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId]);

  let content = <CourseModules />;
  if (isLoading || !selectedCourse) content = <FullScreenLoader loading={isLoading} withHeader={true} />;
  else if (isPreview) content = <CoursePreview />;

  return <>{content}</>;
};
