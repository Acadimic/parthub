import { PositionType } from '@repo/shared/enums';
import { Breadcrumb, Button, type IBreadcrumbItem, Modal } from '@repo/ui/app';
import { Progress } from '@repo/ui/core';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { HouseIcon, ListBulletsIcon } from '@phosphor-icons/react';
import { type ICourse, useSelectedCourse } from '@stores';
import { CourseModuleContent } from './course-modules/CourseModuleContent';
import { CourseOutline } from './CourseOutline';

/** The outline's header: the course name and how far through it the learner is. */
const OutlineHeader = ({ course }: { course: ICourse }) => {
  const { getCourseProgress } = useCourse();
  const progress = getCourseProgress(course._id);
  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-4">
      <div className="truncate text-sm font-semibold">{course.name}</div>
      <div className="flex items-center gap-3">
        <Progress value={progress.percent} className="flex-1" />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  );
};

export const CourseModules = () => {
  const selectedCourse = useSelectedCourse();
  const { selectItem, isCourseMenuOpen, handleCourseMenuClick } = useCourse();

  if (!selectedCourse) return null;

  const crumbs: IBreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <HouseIcon weight="bold" className="h-3 w-3" /> },
    { label: 'Courses', href: '/courses' },
    { label: selectedCourse.name, href: `/courses/${selectedCourse._id}/preview` },
    { label: 'Learn', href: '#' },
  ];

  const handleSelect = (item: ICourseModuleItem) => {
    selectItem(item);
    if (isCourseMenuOpen) handleCourseMenuClick();
  };

  const outline = <CourseOutline courseId={selectedCourse._id} isPreview={false} onSelectItem={handleSelect} />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <Breadcrumb items={crumbs} />
            <div className="lg:hidden">
              <Button
                isSecondary
                className="px-3 py-1.5"
                onClick={handleCourseMenuClick}
                leftsection={<ListBulletsIcon weight="bold" className="h-4 w-4" />}
              >
                Contents
              </Button>
            </div>
          </div>
          <CourseModuleContent />
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
