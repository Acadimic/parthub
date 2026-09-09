import { Accordions } from '@repo/ui/app';
import { DynamicSubtitle } from '@components/common';
import { useCourseLookups, useMeetLookups, useSelectedCourse } from '@stores';
import { getPlural } from '@utils/helpers';
import { CourseContents } from './CourseContents';
import { Sessions } from './course-contents';

interface IProps {
  isPreview: boolean;
  closeCourseOverview: () => void;
}

export const SelectedCourseModules = ({ isPreview, closeCourseOverview }: IProps) => {
  const courseStore = useCourseLookups();
  const meetStore = useMeetLookups();
  const { getCoursesByIds } = courseStore;
  const { getMeetsByIds } = meetStore;
  const selectedCourse = useSelectedCourse();
  const { getCourseModuleByCourseId } = courseStore;

  if (!selectedCourse) return <></>;

  const courses = getCoursesByIds(selectedCourse.courses ?? []);
  const courseModules = getCourseModuleByCourseId(selectedCourse._id);

  return (
    <div>
      {courses.map((courseItem) => {
        const meets = getMeetsByIds(courseItem.meets ?? []);
        return (
          <div key={courseItem._id} id={courseItem._id}>
            <Accordions
              openIndexes={[...courses.map((_, index) => index), courses.length]}
              items={[
                {
                  title: <DynamicSubtitle title={courseItem.name} subtitle="Module" count={courseModules.length} />,
                  component: (
                    <CourseContents
                      closeCourseOverview={closeCourseOverview}
                      courseId={selectedCourse._id}
                      course={courseItem}
                      isPreview={isPreview}
                    />
                  ),
                },
                ...(meets.length
                  ? [
                      {
                        title: (
                          <DynamicSubtitle
                            title={getPlural(meets.length, 'Session')}
                            subtitle="Schedule"
                            count={meets.length}
                          />
                        ),
                        component: (
                          <div className="pt-1 pb-6 px-10">
                            <Sessions meets={meets} isSmallJoinable={true} isCopyIconOnly={true} />
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        );
      })}
    </div>
  );
};
