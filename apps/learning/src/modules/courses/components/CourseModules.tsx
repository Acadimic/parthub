import { Breadcrumb, type IBreadcrumbItem, Modal } from '@repo/ui/app';
import { StandardWithLogo } from '@components/common';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { ListIcon } from '@phosphor-icons/react';
import { House } from '@phosphor-icons/react/dist/ssr';
import { useSelectedCourse, useStandardLookups } from '@stores';
import { useState } from 'react';
import { CourseModuleContent } from './course-modules/CourseModuleContent';
import { SelectedCourseModules } from './SelectedCourseModules';

export const CourseModules = () => {
  const standardStore = useStandardLookups();
  const selectedCourse = useSelectedCourse();
  const { getStandardById } = standardStore;
  const { isSmallScreen } = useWindowDimensions();
  const [isOpenCourseOverView, setIsOpenCourseOverview] = useState(false);

  const openCourseOverview = () => {
    setIsOpenCourseOverview(true);
  };

  const closeCourseOverview = () => {
    setIsOpenCourseOverview(false);
  };

  if (!selectedCourse) return null;

  return (
    <div className="relative">
      <div className="flex">
        <div className="w-full md:w-[70%] py-2 px-4 md:px-6 overflow-auto h-[calc(100vh-4rem)]">
          <div>
            <Breadcrumb
              items={
                [
                  isSmallScreen
                    ? {
                        label: 'Menu',
                        href: '#',
                        icon: <ListIcon weight="bold" className="w-4 h-4" />,
                        onClick: openCourseOverview,
                      }
                    : null,
                  { label: 'Home', href: '/', icon: <House weight="bold" className="w-3 h-3" /> },
                  { label: 'Courses', href: '/courses' },
                  { label: `${selectedCourse.name}`, href: `/courses/${selectedCourse._id}/preview` },
                  { label: `Modules`, href: `#` },
                ].filter(Boolean) as IBreadcrumbItem[]
              }
            />
          </div>
          <div>
            <CourseModuleContent />
          </div>
        </div>
        <div className="hidden md:block md:w-[30%] overflow-auto h-[calc(100vh-4rem)] bg-background py-4 border-l border-border">
          <div>
            <div className="px-4">
              <StandardWithLogo standard={selectedCourse && getStandardById(selectedCourse.standards?.[0] ?? '')} />
            </div>
            <SelectedCourseModules closeCourseOverview={closeCourseOverview} isPreview={false} />
          </div>
        </div>
        <Modal
          title="Modules"
          isOpen={isOpenCourseOverView}
          onClose={closeCourseOverview}
          component={
            isOpenCourseOverView && (
              <SelectedCourseModules closeCourseOverview={closeCourseOverview} isPreview={false} />
            )
          }
          childrenClassName="px-0"
        />
      </div>
    </div>
  );
};
