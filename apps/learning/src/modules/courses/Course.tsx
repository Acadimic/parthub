import { FullScreenLoader } from '@parthhub/ui/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { CourseModules, CoursePreview } from './components';

interface IProps {
  courseId: string;
  isPreview: boolean;
}

export const Course = observer(({ courseId, isPreview }: IProps) => {
  const { courseStore, selectorStore } = useStores();
  const { loadCourseModules, loadCourses, loadCompletedModules } = courseStore;
  const { selectedUser, selectedCourse, setSelectedCourseId } = selectorStore;
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
});
