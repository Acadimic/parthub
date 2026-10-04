import { Button } from '@repo/ui/app';
import { useCourse } from '@hooks/course.hook';
import { PlayCircleIcon } from '@phosphor-icons/react';
import type { ICourse } from '@stores';
import { ShareCourse } from '../course-modules';

interface IProps {
  course: ICourse;
}

/** The enrolled learner's way back in: open the course where they left off, or share it. */
export const CourseCta = ({ course }: IProps) => {
  const { getCourseProgress, openCourse } = useCourse();
  const progress = getCourseProgress(course._id);
  const hasStarted = progress.completed > 0;
  const isDone = progress.total > 0 && progress.completed === progress.total;
  // Opening goes through a seat whatever the course costs: a free one is granted on the spot, so
  // the box still records the start, and a learner who began before seats existed just claims one.

  const getCtaLabel = () => {
    if (isDone) return 'Review course';
    if (hasStarted) return 'Continue learning';
    return 'Start learning';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        isFull
        className="flex-1 px-4 py-2.5"
        disabled={progress.total === 0}
        onClick={() => openCourse(course._id)}
        leftsection={<PlayCircleIcon weight="fill" className="h-5 w-5" />}
      >
        {progress.total === 0 ? 'No content yet' : getCtaLabel()}
      </Button>
      <ShareCourse courseId={course._id} appearance="outline" />
    </div>
  );
};
