import { Badge, Progress } from '@repo/ui/core';
import { Button } from '@repo/ui/app';
import { CourseCover } from '../CourseCover';
import { useCourse } from '@hooks/course.hook';
import {
  BookOpenTextIcon,
  ClockIcon,
  FileTextIcon,
  PlayCircleIcon,
  SealCheckIcon,
  VideoCameraIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { type ICourse, useCourseLookups, useEnrollmentLookups } from '@stores';
import { getPlural } from '@utils/helpers';
import { ShareCourse } from '../course-modules';
import { AI_GENERATED_COURSE_TAG } from '@utils/constants';
import { getStringFormattedDate } from '@utils/helpers';
import { CoursePlans } from './CoursePlans';

interface IProps {
  course: ICourse;
}

const IncludesRow = ({ icon: RowIcon, label }: { icon: typeof ClockIcon; label: string }) => (
  <li className="flex items-center gap-2.5 text-sm">
    <RowIcon weight="bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
    <span>{label}</span>
  </li>
);

/** A count with its noun, or nothing when the count is zero. */
const countLabel = (count: number, noun: string) => (count ? `${count} ${getPlural(count, noun)}` : '');

/** What the course contains, as one line per kind of content it actually has. */
const IncludesList = ({ course, modulesCount }: { course: ICourse; modulesCount: number }) => {
  const stats = course.stats;
  const totalMins = stats ? stats.testsDurationMins + stats.materialsDurationMins + stats.meetsDurationMins : 0;
  const hours = Math.round((totalMins / 60) * 10) / 10;
  const rows = [
    { icon: ClockIcon, label: hours ? `${hours} hours of content` : 'Self-paced' },
    { icon: BookOpenTextIcon, label: countLabel(modulesCount, 'module') },
    { icon: YoutubeLogoIcon, label: countLabel(stats?.videosCount ?? 0, 'video') },
    { icon: BookOpenTextIcon, label: countLabel(stats?.readingsCount ?? 0, 'reading') },
    { icon: FileTextIcon, label: countLabel(stats?.testsCount ?? 0, 'test') },
    { icon: VideoCameraIcon, label: countLabel(stats?.meetsCount ?? 0, 'live session') },
  ].filter((row) => row.label);

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-caps text-muted-foreground">
        This course includes
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <IncludesRow key={row.label} icon={row.icon} label={row.label} />
        ))}
      </ul>
    </div>
  );
};

/**
 * The cover, the call to action and what the course contains: the one card a learner needs to
 * decide to start. Sticky beside the syllabus on a wide screen, first thing under the title on a
 * phone.
 */
export const CourseSummaryCard = ({ course }: IProps) => {
  const { getCourseProgress, openCourse, getCourseModules } = useCourse();
  const progress = getCourseProgress(course._id);
  const modulesCount = getCourseModules(course._id).length;
  const hasStarted = progress.completed > 0;
  const isDone = progress.total > 0 && progress.completed === progress.total;
  const { getPlansByCourseId } = useCourseLookups();
  const { getActiveEnrollment } = useEnrollmentLookups();
  const plans = getPlansByCourseId(course._id);
  const enrollment = getActiveEnrollment(course._id);
  // Opening goes through a seat whatever the course costs: a free one is granted on the spot, so
  // the box still records the start, and a learner who began before seats existed just claims one.

  const getCtaLabel = () => {
    if (isDone) return 'Review course';
    if (hasStarted) return 'Continue learning';
    return 'Start learning';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <CourseCover course={course} imageClassName="" />
        {/* The AI tag is spelled out beside the title by the hero; any other tag is shown as it is. */}
        {course.tag && course.tag !== AI_GENERATED_COURSE_TAG ? (
          <div className="absolute left-3 top-3">
            <Badge tone="brand" appearance="solid">
              {course.tag}
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 p-4 md:p-5">
        {progress.total > 0 && hasStarted ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium">{isDone ? 'Completed' : 'Your progress'}</span>
              <span className="font-mono text-muted-foreground">
                {progress.completed}/{progress.total}
              </span>
            </div>
            <Progress value={progress.percent} />
          </div>
        ) : null}
        {enrollment ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
            <SealCheckIcon weight="fill" className="h-4 w-4 shrink-0" />
            <span>
              Enrolled
              {enrollment.endsAt ? ` · access until ${getStringFormattedDate(enrollment.endsAt)}` : ''}
            </span>
          </div>
        ) : null}
        {enrollment ? (
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
            <ShareCourse courseId={course._id} isCompact />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <CoursePlans course={course} plans={plans} />
            <div className="flex justify-end">
              <ShareCourse courseId={course._id} isCompact />
            </div>
          </div>
        )}
        <IncludesList course={course} modulesCount={modulesCount} />
      </div>
    </div>
  );
};
