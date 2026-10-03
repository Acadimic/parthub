import { Link } from '@repo/ui/app';
import { Badge, Progress } from '@repo/ui/core';
import { type ICourseActivity } from '@interfaces';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { getPlural, getStringFormattedDate } from '@utils/helpers';

/** One card per course the learner has started: how far along, and the way back in. */
export const CourseProgressCards = ({ courses }: { courses: ICourseActivity[] }) => (
  // `minmax(0, 1fr)` and `min-w-0`: a grid track is otherwise as wide as its longest title, which
  // never wraps, so the cards ran off a phone's screen instead of truncating it.
  <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-3">
    {courses.map((course) => {
      const isDone = course.total > 0 && course.completed >= course.total;
      return (
        <div
          key={course.courseId}
          className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{course.name}</div>
              <div className="text-xs text-muted-foreground">
                {course.lastActiveAt ? `Last active ${getStringFormattedDate(course.lastActiveAt)}` : 'Not started'}
              </div>
            </div>
            <Badge tone={isDone ? 'success' : 'primary'} className="shrink-0">
              {isDone ? 'Completed' : `${course.percent}%`}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={course.percent} className="flex-1" />
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {course.completed}/{course.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {course.attempts} {getPlural(course.attempts, 'test attempt')}
            </span>
            <Link
              href={`/courses/${course.courseId}/modules`}
              isSubtle
              className="px-2 py-1 text-xs text-primary"
              rightsection={<ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />}
            >
              {isDone ? 'Review' : 'Continue'}
            </Link>
          </div>
        </div>
      );
    })}
  </div>
);
