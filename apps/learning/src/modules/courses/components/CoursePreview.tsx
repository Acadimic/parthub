import { Breadcrumb, IBreadcrumbItem } from '@parthhub/ui/app';
import { CourseItemType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { ListIcon } from '@phosphor-icons/react';
import { House } from '@phosphor-icons/react/dist/ssr';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { CourseSidebar, SessionsInfo } from './';
import { SelectedCourseModules } from './SelectedCourseModules';

export const CoursePreview = observer(() => {
  const { selectorStore } = useStores();
  const { selectedCourse, selectedCourseItem } = selectorStore;
  const { isCourseMenuOpen, handleCourseMenuClick } = useCourse();
  const { isSmallScreen } = useWindowDimensions();

  return (
    <div className="relative">
      <CourseSidebar>
        <>
          <div className="px-3 pt-5 pb-1 bg-background-primary">
            <Breadcrumb
              items={
                [
                  isSmallScreen || !isCourseMenuOpen
                    ? {
                        label: 'Menu',
                        href: '#',
                        icon: <ListIcon weight="bold" className="w-4 h-4" />,
                        onClick: handleCourseMenuClick,
                      }
                    : null,
                  { label: 'Home', href: '/', icon: <House weight="bold" className="w-3 h-3" /> },
                  { label: 'Learning', href: '/learning' },
                  { label: 'Courses', href: '/courses' },
                  { label: selectedCourse?.name, href: '#' },
                ].filter(Boolean) as IBreadcrumbItem[]
              }
            />
          </div>
          {CourseItemType.SESSIONS === selectedCourseItem ? (
            <SessionsInfo />
          ) : (
            <SelectedCourseModules isPreview={true} closeCourseOverview={() => {}} />
          )}
        </>
      </CourseSidebar>
    </div>
  );
});
