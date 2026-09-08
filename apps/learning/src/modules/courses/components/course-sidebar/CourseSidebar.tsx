import { useCourse } from '@hooks/course.hook';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';
import { CourseSidebarContent } from './CourseSidebarContent';

const drawerWidth = 300;

interface IProps {
  children: ReactNode;
}

export const CourseSidebar = ({ children }: IProps) => {
  const { isCourseMenuOpen, handleCourseMenuClick } = useCourse();
  const { route, push, query, back } = useRouter();

  return (
    <div className="bg-background-primary">
      <div className="flex">
        {/* Mobile drawer overlay */}
        {isCourseMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={handleCourseMenuClick} />
        )}
        {/* Mobile drawer */}
        <aside
          className={`fixed top-0 left-0 h-full z-50 sm:hidden transition-transform duration-300 ${
            isCourseMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: drawerWidth }}
        >
          <CourseSidebarContent />
        </aside>
        {/* Desktop drawer */}
        <aside
          className={`hidden sm:block flex-shrink-0 transition-all duration-300 overflow-hidden`}
          style={{ width: isCourseMenuOpen ? drawerWidth : 65 }}
        >
          <div
            className="fixed top-0 left-0 h-full overflow-hidden"
            style={{ width: isCourseMenuOpen ? drawerWidth : 65 }}
          >
            <CourseSidebarContent />
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 w-full">
          <div className="overflow-y-auto">
            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
