import { PositionType } from '@repo/shared/enums';
import { Breadcrumb, Button, type IBreadcrumbItem, Link, Modal } from '@repo/ui/app';
import { Progress } from '@repo/ui/core';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { ArrowLeftIcon, HouseIcon, ListBulletsIcon } from '@phosphor-icons/react';
import { type ICourse, useSelectedCourse } from '@stores';
import { CourseModuleContent, LessonNav } from './course-modules/CourseModuleContent';
import { CourseOutline } from './CourseOutline';

/** The outline's header: the course name, a way back to its overview, and how far through it is. */
const OutlineHeader = ({ course }: { course: ICourse }) => {
  const { getCourseProgress } = useCourse();
  const progress = getCourseProgress(course._id);
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">Course</div>
          <div className="truncate text-sm font-semibold">{course.name}</div>
        </div>
        <Link href={`/courses/${course._id}/preview`} isSubtle className="shrink-0 px-2 py-1 text-xs text-primary">
          Overview
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={progress.percent} className="flex-1" />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  );
};

/**
 * The learning view: a sticky toolbar with the trail back out, the lesson column, and the course
 * outline — a fixed pane from `lg` up, a drawer below that.
 */
export const CourseModules = () => {
  const selectedCourse = useSelectedCourse();
  const { selectItem, isCourseMenuOpen, handleCourseMenuClick, getCourseProgress } = useCourse();

  if (!selectedCourse) return null;

  const previewHref = `/courses/${selectedCourse._id}/preview`;
  const progress = getCourseProgress(selectedCourse._id);
  const crumbs: IBreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <HouseIcon weight="bold" className="h-3 w-3" /> },
    { label: 'Courses', href: '/courses' },
    { label: selectedCourse.name, href: previewHref },
    { label: 'Learn', href: '#' },
  ];

  const handleSelect = (item: ICourseModuleItem) => {
    selectItem(item);
    if (isCourseMenuOpen) handleCourseMenuClick();
  };

  const outline = <CourseOutline courseId={selectedCourse._id} isPreview={false} onSelectItem={handleSelect} />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-muted/40">
        <div className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 md:px-6">
            <Link
              href={previewHref}
              isSubtle
              aria-label="Back to course overview"
              className="shrink-0 px-2 py-1.5 text-foreground"
              leftsection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <div className="hidden min-w-0 flex-1 md:block">
              <Breadcrumb items={crumbs} />
            </div>
            <div className="min-w-0 flex-1 md:hidden">
              <div className="truncate text-sm font-semibold">{selectedCourse.name}</div>
              <div className="font-mono text-xxs text-muted-foreground">
                {progress.completed}/{progress.total} done
              </div>
            </div>
            <div className="shrink-0 lg:hidden">
              <Button
                isSecondary
                className="px-3 py-1.5"
                onClick={handleCourseMenuClick}
                leftsection={<ListBulletsIcon weight="bold" className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">Contents</span>
                <span className="sm:hidden">{progress.total}</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 md:px-6 md:py-6">
          <CourseModuleContent />
        </div>
        <div className="sticky bottom-0 z-10 border-t border-border bg-background">
          <LessonNav />
        </div>
      </div>
      <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-background lg:flex xl:w-[400px]">
        <OutlineHeader course={selectedCourse} />
        <div className="min-h-0 flex-1 overflow-y-auto">{outline}</div>
      </aside>
      <Modal
        title="Course contents"
        position={PositionType.RIGHT}
        isOpen={isCourseMenuOpen}
        onClose={handleCourseMenuClick}
        childrenClassName="px-0"
        component={
          <div className="flex flex-col">
            <OutlineHeader course={selectedCourse} />
            {outline}
          </div>
        }
      />
    </div>
  );
};
