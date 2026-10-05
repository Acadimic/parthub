import { Button } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { BlankState } from '@components/others';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { useCourseStore } from '@stores';
import { Course, CourseNotFound } from './Course';
import { CoursePreviewSkeleton } from './components';

interface IProps {
  slug: string;
}

/**
 * The course preview at its public address. The slug is resolved against the catalogue, which
 * holds every published course and which the preview loads anyway, so no extra request is made.
 */
export const CourseBySlug = ({ slug }: IProps) => {
  const { isLoaded, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const course = useCourseStore((state) => state.getCourseBySlug(slug));

  if (isFailed) {
    return (
      <BlankState
        className="py-24"
        label="Could not load this course"
        description={error || 'Something went wrong on our side. Please try again.'}
        action={
          <Button
            isSecondary
            onClick={() => useCourseStore.getState().loadCourses()}
            leftsection={<ArrowClockwiseIcon weight="bold" className="h-4 w-4" />}
          >
            Try again
          </Button>
        }
      />
    );
  }
  // Not `isLoading`: that is false before the first load starts, which would flash "not found".
  if (!isLoaded || !slug) return <CoursePreviewSkeleton />;
  if (!course) return <CourseNotFound />;
  return <Course courseId={course._id} isPreview={true} />;
};
