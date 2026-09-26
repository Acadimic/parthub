import { Button, Link } from '@repo/ui/app';
import { useCourse } from '@hooks/course.hook';
import { ArrowRightIcon, ChartLineUpIcon, TrophyIcon } from '@phosphor-icons/react';
import { type ICourse } from '@stores';
import { getPlural } from '@utils/helpers';

interface IProps {
  course: ICourse;
}

/**
 * Shown at the top of the lesson column once every item in the course is done: the achievement,
 * and the three sensible next moves. It renders nothing while anything is still open.
 */
export const CourseCompleteBanner = ({ course }: IProps) => {
  const { getCourseProgress, getCourseItems, selectItem } = useCourse();
  const progress = getCourseProgress(course._id);
  if (!progress.total || progress.completed < progress.total) return null;

  const tests = getCourseItems(course._id).filter((item) => item.testPaper).length;
  const lessons = progress.total - tests;
  const first = getCourseItems(course._id)[0];

  return (
    <section className="relative overflow-hidden rounded-xl border border-success/30 bg-gradient-to-br from-success/15 via-background to-background p-5 md:p-6">
      <TrophyIcon
        weight="fill"
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-success/10"
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <TrophyIcon weight="fill" className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-caps text-success">Course complete</div>
            <h2 className="mt-0.5 text-lg font-semibold md:text-xl">You have finished {course.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lessons} {getPlural(lessons, 'lesson')} and {tests} {getPlural(tests, 'test')} done. Everything stays
              open, so come back to any of it whenever you like.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0 md:flex-col md:items-stretch">
          <Link
            href="/courses"
            className="px-4 py-2"
            rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
          >
            Find your next course
          </Link>
          <div className="flex gap-2">
            <Link
              href="/activity"
              isSecondary
              className="flex-1 px-3 py-2 text-foreground"
              leftsection={<ChartLineUpIcon weight="bold" className="h-4 w-4" />}
            >
              Your activity
            </Link>
            {first ? (
              <Button isSubtle className="flex-1 whitespace-nowrap px-3 py-2" onClick={() => selectItem(first)}>
                Review from the start
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
