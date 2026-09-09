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
    const promise1 = !selectedCourse ? loadCourses() : Promise.resolve();
    const promise2 = !selectedCourse?.isLoadedContents ? loadCourseModules(courseId) : Promise.resolve();
    const promise3 = !selectedUser?.isLoadedCompletedModules ? loadCompletedModules() : Promise.resolve();
    await promise1;
    await Promise.all([promise2, promise3]);
    setSelectedCourseId(courseId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId]);

  return (
    <>
      {isLoading || !selectedCourse ? (
        <FullScreenLoader loading={isLoading} withHeader={true} />
      ) : isPreview ? (
        <CoursePreview />
      ) : (
        <CourseModules />
      )}
    </>
  );
};
