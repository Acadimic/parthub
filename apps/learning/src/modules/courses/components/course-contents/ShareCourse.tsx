import { ShareFatIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

interface IProps {
  courseId: string;
}

export const ShareCourse = observer(({ courseId }: IProps) => {
  const { courseStore } = useStores();
  const { getCourseById } = courseStore;

  const course = useMemo(() => {}, [courseId]);

  return (
    <div className="cursor-pointer flex items-center space-x-2 rounded-full bg-color-light border border-color-border py-1.5 px-4">
      <ShareFatIcon weight="bold" className="h-5 w-5" />
      <div className="text-sm font-medium pr-1">Share</div>
    </div>
  );
});
