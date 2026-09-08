import { SimpleAccordions } from '@repo/ui/app';
import { StandardWithLogo } from '@components/common';
import { CourseItemType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { CaretDoubleRightIcon } from '@phosphor-icons/react';
import { type ICourseModule, useStores } from '@stores';
import { getPlural } from '@utils/helpers';
import { CourseDayTab } from './CourseDayTab';
import { CourseTab } from './CourseTab';

export const CourseSidebarContent = () => {
  const { courseStore, standardStore, selectorStore } = useStores();
  const { getCourseById, getCourseModuleByCourseId } = courseStore;
  const { selectedCourse } = selectorStore;
  const { getStandardById } = standardStore;
  const { isCourseMenuOpen, handleCourseMenuClick } = useCourse();

  return (
    <div className={`h-full bg-background-primary`}>
      <div className="h-screen flex flex-col justify-between pl-7">
        <div className="hidden sm:block h-16" />
        <div className={`overflow-y-auto grow ${isCourseMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="py-4 flex flex-col space-y-1 pr-2">
            <div className="pr-4">
              <StandardWithLogo standard={selectedCourse && getStandardById(selectedCourse?.standards[0])} />
              <div className="text-sm py-3 text-wrap">
                <span className="line-clamp-3">{selectedCourse?.description}</span>
              </div>
            </div>
            <div className="w-full">
              {selectedCourse?.courses.map((courseId: string) => {
                const course = getCourseById(courseId);
                const courseModules = getCourseModuleByCourseId(courseId);
                if (!course) return null;
                return (
                  <div
                    key={courseId}
                    className={'w-full text-sm font-medium flex items-center space-x-2 capitalize cursor-pointer'}
                  >
                    <SimpleAccordions
                      openIndexes={[0]}
                      items={[
                        {
                          title: (
                            <div className="flex-1 truncate flex flex-col space-y-0.5">
                              <div className="truncate">{course.name}</div>
                              <div className="text-xs text-color-secondary">
                                ({courseModules.length} {getPlural(courseModules.length, 'Module')})
                              </div>
                            </div>
                          ),
                          component: (
                            <div className="ml-3 flex flex-col space-y-1">
                              {courseModules.map((dayCourse: ICourseModule) => {
                                return <CourseDayTab key={dayCourse._id} courseModule={dayCourse} />;
                              })}
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                );
              })}
            </div>
            <div>
              <CourseTab courseTab={CourseItemType.COURSE_INFO} />
            </div>
            <div>
              <CourseTab courseTab={CourseItemType.SESSIONS} />
            </div>
            <div>
              <CourseTab courseTab={CourseItemType.NOTES} />
            </div>
            <div>
              <CourseTab courseTab={CourseItemType.DOUBTS} />
            </div>
            <div>
              <CourseTab courseTab={CourseItemType.MESSAGES} />
            </div>
          </div>
        </div>
        <div>
          <div className="py-4 w-full flex justify-end items-center pr-3">
            <button onClick={handleCourseMenuClick} className="p-1 rounded hover:bg-background-secondary">
              <CaretDoubleRightIcon
                weight="bold"
                className={`w-5 h-5 transition ${isCourseMenuOpen ? 'rotate-180' : 'text-blue-primary'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
