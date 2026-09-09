import { Accordions } from '@repo/ui/app';
import { type ICourse, useCourseLookups, useMaterialLookups, useTestPaperLookups } from '@stores';
import { CourseContentItem } from './CourseContentItem';
import { CourseInfo } from './CourseInfo';

interface IProps {
  courseId: string;
  course: ICourse;
  isPreview: boolean;
  closeCourseOverview: () => void;
}

export const CourseContents = ({ courseId, course, isPreview, closeCourseOverview }: IProps) => {
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const { getMaterialsByIds } = materialStore;
  const { getTestPapersByIds } = testPaperStore;
  const { getCourseModuleByCourseId } = courseStore;

  const courseModules = getCourseModuleByCourseId(course._id);

  return (
    <div className="">
      <div className="text-xs px-10 pb-4">
        <CourseInfo courseStats={course.stats} />
      </div>
      {isPreview && course.description ? (
        <div className="text-sm py-4 border-t border-color-border px-10">{course.description}</div>
      ) : null}
      <div className="px-6">
        <Accordions
          openIndexes={courseModules.map((_, index) => index)}
          items={courseModules.map((courseModule) => ({
            id: courseModule._id,
            title: (
              <div className="text-sm">
                <span className="purple-gradient">{courseModule.name}</span>{' '}
                <span className="text-xs text-color-secondary">(Module {courseModule.day})</span>
              </div>
            ),
            component: (
              <div className="px-5">
                {isPreview && courseModule.description ? (
                  <div className="text-sm px-5 border-t border-color-border py-4">{courseModule.description}</div>
                ) : null}

                <div className="flex flex-col divide-y divide-color-border">
                  {getMaterialsByIds(courseModule.materials ?? []).map((material) => {
                    return (
                      <CourseContentItem
                        courseId={courseId}
                        courseModuleId={courseModule._id}
                        key={material._id}
                        material={material}
                        isPreview={isPreview}
                        closeCourseOverview={closeCourseOverview}
                      />
                    );
                  })}
                  {getTestPapersByIds(courseModule.testPapers ?? []).map((testPaper) => {
                    return (
                      <CourseContentItem
                        courseId={courseId}
                        courseModuleId={courseModule._id}
                        key={testPaper._id}
                        testPaper={testPaper}
                        isPreview={isPreview}
                        closeCourseOverview={closeCourseOverview}
                      />
                    );
                  })}
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
};
