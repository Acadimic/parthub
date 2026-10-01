import { PositionType } from '@repo/shared/enums';
import { Breadcrumb, Button, type IBreadcrumbItem, Link, Modal, ToggleTheme } from '@repo/ui/app';
import { Badge, Progress } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { ProfileDropdown } from '@components/app/sidebars/components';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import {
  ArrowLeftIcon,
  CaretDoubleRightIcon,
  CheckCircleIcon,
  HouseIcon,
  ListBulletsIcon,
} from '@phosphor-icons/react';
import { type ICourse, useSelectedCourse } from '@stores';
import { useState } from 'react';
import { CourseCompleteBanner, CourseModuleContent } from './course-modules';
import { CourseOutline } from './CourseOutline';

/** The outline's header: the course name, a way back to its overview, and how far through it is. */
const OutlineHeader = ({ course }: { course: ICourse }) => {
  const { getCourseProgress } = useCourse();
  const progress = getCourseProgress(course._id);
  const isDone = progress.total > 0 && progress.completed >= progress.total;
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
        <Progress
          value={progress.percent}
          className={cn('flex-1', isDone && '[&>div>div]:bg-success')}
          aria-label={`${progress.completed} of ${progress.total} items done`}
        />
        {isDone ? (
          <Badge tone="success" appearance="solid" className="shrink-0 gap-1">
            <CheckCircleIcon weight="fill" className="h-3 w-3" />
            Completed
          </Badge>
        ) : (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {progress.completed}/{progress.total}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * The learning view, on its own shell with no app header: a top bar with the trail back out, the
 * theme and the account; the lesson column; and the course outline — a pane from `lg` up that can
 * be folded away to give the lesson the whole width, and a drawer below that.
 */
export const CourseModules = () => {
  const selectedCourse = useSelectedCourse();
  const { selectItem, isCourseMenuOpen, handleCourseMenuClick, getCourseProgress } = useCourse();
  const [isOutlineHidden, setIsOutlineHidden] = useState(false);

  if (!selectedCourse) return null;

  const previewHref = `/courses/${selectedCourse._id}/preview`;
  const progress = getCourseProgress(selectedCourse._id);
  const isDone = progress.total > 0 && progress.completed >= progress.total;
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

  const outline = (
    <CourseOutline courseId={selectedCourse._id} isPreview={false} isLocked={false} onSelectItem={handleSelect} />
  );
  const columnWidth = isOutlineHidden ? 'max-w-6xl' : 'max-w-5xl';

  return (
    <div className="flex h-[100vh]">
      {/* The top bar sits outside the column's scroller, so the scrollbar runs under it rather than
          beside it and the bar meets the outline pane with no gap. */}
      <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
        <div className="shrink-0 border-b border-border bg-background">
          <div className={cn('mx-auto flex h-14 items-center gap-2 px-3 md:px-6', columnWidth)}>
            <Link
              href={previewHref}
              isSubtle
              aria-label="Back to course overview"
              className="shrink-0 px-2 py-1.5 text-foreground"
              labelClassName="hidden sm:inline"
              leftsection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
            >
              Overview
            </Link>
            <div className="hidden min-w-0 flex-1 md:block">
              <Breadcrumb items={crumbs} />
            </div>
            <div className="min-w-0 flex-1 md:hidden">
              <div className="truncate text-sm font-semibold">{selectedCourse.name}</div>
              <div className={cn('font-mono text-xxs', isDone ? 'text-success' : 'text-muted-foreground')}>
                {isDone ? 'Completed' : `${progress.completed}/${progress.total} done`}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <div className="lg:hidden">
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
              <ToggleTheme />
              <ProfileDropdown />
              <div className="hidden lg:block">
                <Button
                  isSubtle
                  aria-label={isOutlineHidden ? 'Show course contents' : 'Hide course contents'}
                  aria-expanded={!isOutlineHidden}
                  className="rounded-full p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOutlineHidden(!isOutlineHidden)}
                  leftsection={
                    <CaretDoubleRightIcon
                      weight="bold"
                      className={cn('h-4 w-4 transition-transform duration-300', isOutlineHidden && 'rotate-180')}
                    />
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={cn('mx-auto w-full px-3 py-4 md:px-6 md:py-6', columnWidth)}>
            <div className="flex flex-col gap-4 md:gap-5">
              <CourseCompleteBanner course={selectedCourse} />
              <CourseModuleContent />
            </div>
          </div>
        </div>
      </div>
      {/* The outline pane folds to nothing from the toggle at the end of the top bar, so the lesson
          can take the whole width and the outline is one click away. */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col bg-background transition-[width] duration-300 lg:flex',
          isOutlineHidden ? 'w-0' : 'w-[360px] border-l border-border xl:w-[400px]',
        )}
      >
        <div className={cn('flex h-full min-h-0 flex-col', isOutlineHidden && 'hidden')}>
          <OutlineHeader course={selectedCourse} />
          {/* The outline scrolls its own tab panels, so this is a column for it to fill, not a scroller. */}
          <div className="flex min-h-0 flex-1 flex-col">{outline}</div>
        </div>
      </aside>
      <Modal
        title="Course contents"
        position={PositionType.RIGHT}
        isOpen={isCourseMenuOpen}
        onClose={handleCourseMenuClick}
        childrenClassName="px-0"
        component={
          <div className="flex h-full flex-col">
            <OutlineHeader course={selectedCourse} />
            {outline}
          </div>
        }
      />
    </div>
  );
};
