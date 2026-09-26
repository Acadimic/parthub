import { Breadcrumb, type IBreadcrumbItem } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { Avatar } from '@components/app/avatars';
import { useCourse } from '@hooks/course.hook';
import { CalendarBlankIcon, ClockIcon, HouseIcon, SparkleIcon, StackIcon } from '@phosphor-icons/react';
import { type ICourse, useStandardLookups, useUserLookups } from '@stores';
import { AI_GENERATED_COURSE_TAG } from '@utils/constants';
import { getPlural, getStringFormattedDate } from '@utils/helpers';

interface IProps {
  course: ICourse;
}

const MetaItem = ({ icon: MetaIcon, children }: { icon: typeof ClockIcon; children: React.ReactNode }) => (
  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <MetaIcon weight="bold" className="h-4 w-4" />
    {children}
  </span>
);

/** The standards and subjects the course is catalogued under. */
const CatalogueBadges = ({ course }: IProps) => {
  const { getStandardsByIds, getSubjectsByIds } = useStandardLookups();
  const standards = getStandardsByIds(course.standards ?? []);
  const subjects = getSubjectsByIds(course.subjects ?? []);
  const isAiAssisted = course.tag === AI_GENERATED_COURSE_TAG;
  if (!standards.length && !subjects.length && !isAiAssisted) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* The Terms promise this label on every course a model helped draft; the teacher reviewed it. */}
      {isAiAssisted ? (
        <Badge tone="info" className="gap-1">
          <SparkleIcon weight="fill" className="h-3 w-3" />
          Prepared with AI assistance
        </Badge>
      ) : null}
      {standards.map((standard) => (
        <Badge key={standard._id} tone="primary">
          {standard.name}
        </Badge>
      ))}
      {subjects.map((subject) => (
        <Badge key={subject._id} tone="neutral" appearance="outline">
          {subject.name}
        </Badge>
      ))}
    </div>
  );
};

/** Who published the course. Either half may be missing for a course from another organization. */
const TeacherRow = ({ course }: IProps) => {
  const { getUserById, getOrgById } = useUserLookups();
  const teacher = course.createdBy ? getUserById(course.createdBy) : undefined;
  const org = course.org ? getOrgById(course.org) : undefined;
  if (!teacher && !org) return null;
  return (
    <div className="flex items-center gap-3">
      {teacher ? <Avatar id={teacher._id} name={teacher.name || 'Teacher'} avatar={teacher.photoUrl} /> : null}
      <div className="text-sm">
        {teacher ? <div className="font-medium">{teacher.name}</div> : null}
        {org ? <div className="text-xs text-muted-foreground">{org.name}</div> : null}
      </div>
    </div>
  );
};

/** The title block: where the course sits in the catalogue, what it is, and who teaches it. */
export const CourseHero = ({ course }: IProps) => {
  const { getCourseModules } = useCourse();
  const modulesCount = getCourseModules(course._id).length;
  const stats = course.stats;
  const totalMins = stats ? stats.testsDurationMins + stats.materialsDurationMins + stats.meetsDurationMins : 0;

  const crumbs: IBreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <HouseIcon weight="bold" className="h-3 w-3" /> },
    { label: 'Courses', href: '/courses' },
    { label: course.name, href: '#' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={crumbs} />
      <CatalogueBadges course={course} />
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{course.name}</h1>
        {course.description ? (
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{course.description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <MetaItem icon={StackIcon}>
          {modulesCount} {getPlural(modulesCount, 'module')}
        </MetaItem>
        {totalMins ? <MetaItem icon={ClockIcon}>{totalMins} min</MetaItem> : null}
        {course.publishedDate ? (
          <MetaItem icon={CalendarBlankIcon}>Published {getStringFormattedDate(course.publishedDate)}</MetaItem>
        ) : null}
      </div>
      <TeacherRow course={course} />
    </div>
  );
};
