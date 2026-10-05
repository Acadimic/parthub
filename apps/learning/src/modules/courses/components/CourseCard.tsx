import { Badge, Progress } from '@repo/ui/core';
import { ArrowRightIcon, BookOpenTextIcon, ClockIcon, FileTextIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { type ICourse, useSelectorLookups, useStandardLookups } from '@stores';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { getCoursePath } from '@utils/helpers';
import { CourseCover } from './CourseCover';

interface IProps {
  course: ICourse;
  /** 0–100 for a course the learner has started, and `null` for one they have not. */
  progress: number | null;
}

/** "7h 20m", or "45m"; nothing for a course with no timed content yet. */
const getDuration = (mins: number) => {
  if (!mins) return '';
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const getCallToAction = (isStarted: boolean, isDone: boolean) => {
  if (isDone) return 'Review course';
  if (isStarted) return 'Continue learning';
  return 'View course';
};

const Stat = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="flex items-center gap-1 whitespace-nowrap">
    {icon}
    {children}
  </span>
);

/** What is inside the course, as icon-and-count pairs. Zero counts are left out. */
const StatsRow = ({ course }: { course: ICourse }) => {
  const stats = course.stats;
  if (!stats) return null;
  const duration = getDuration(stats.testsDurationMins + stats.materialsDurationMins + stats.meetsDurationMins);
  const items = [
    { key: 'videos', count: stats.videosCount, icon: <VideoCameraIcon weight="bold" className="h-3.5 w-3.5" /> },
    { key: 'readings', count: stats.readingsCount, icon: <BookOpenTextIcon weight="bold" className="h-3.5 w-3.5" /> },
    { key: 'tests', count: stats.testsCount, icon: <FileTextIcon weight="bold" className="h-3.5 w-3.5" /> },
  ].filter((item) => item.count > 0);
  if (!items.length && !duration) {
    return <span className="text-xs text-muted-foreground">Content coming soon</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <Stat key={item.key} icon={item.icon}>
          {item.count} {item.key}
        </Stat>
      ))}
      {duration ? <Stat icon={<ClockIcon weight="bold" className="h-3.5 w-3.5" />}>{duration}</Stat> : null}
    </div>
  );
};

/**
 * One course in the catalogue: the cover with the standard on it, the name and blurb, what it
 * holds, and either how far the learner has got or an invitation to start.
 */
export const CourseCard = ({ course, progress }: IProps) => {
  const { setSelectedCourseId } = useSelectorLookups();
  const { getStandardsByIds, getSubjectsByIds } = useStandardLookups();
  const standard = getStandardsByIds(course.standards ?? [])[0];
  const subjects = getSubjectsByIds(course.subjects ?? []).slice(0, 2);
  const isStarted = progress !== null;
  const isDone = progress !== null && progress >= 100;

  return (
    <Link
      href={getCoursePath(course)}
      onClick={() => setSelectedCourseId(course._id)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <CourseCover course={course} imageClassName="transition-transform duration-300 group-hover:scale-[1.03]" />
        {standard ? (
          <Badge tone="neutral" appearance="solid" className="absolute left-3 top-3 bg-background/90 text-foreground">
            {standard.name}
          </Badge>
        ) : null}
        {isDone ? (
          <Badge tone="success" appearance="solid" className="absolute right-3 top-3">
            Completed
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">{course.name}</h3>
          {course.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          ) : null}
        </div>
        {subjects.length ? (
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((subject) => (
              <Badge key={subject._id} tone="neutral" appearance="outline">
                {subject.name}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 pt-1">
          <StatsRow course={course} />
          {isStarted ? (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          ) : null}
          <span className="flex items-center gap-1 text-sm font-medium text-primary">
            {getCallToAction(isStarted, isDone)}
            <ArrowRightIcon
              weight="bold"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
};
