import { useRequest } from '@repo/ui/hooks';
import { FullScreenLoader } from '@repo/ui/app';
import { Container } from '@components/others';
import { DotsNineIcon } from '@phosphor-icons/react';
import { useCourseLookups, useStandardLookups, useStandardStore } from '@stores';
import { CourseCard } from './components/CourseCard';

interface IProps {
  isFilter?: boolean;
}

export const Courses = ({ isFilter }: IProps) => {
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const groupedCoursesByStandardId = courseStore.getGroupedCoursesByStandardId();
  const { getStandardById } = standardStore;
  const publicData = useRequest(useStandardStore, 'publicData');

  return (
    <>
      {publicData.isLoaded ? (
        <Container>
          <div className="py-6">
            {isFilter && (
              <div className="flex justify-between items-center">
                <div>Filter</div>
              </div>
            )}
            <div className="flex flex-col space-y-12">
              {Object.keys(groupedCoursesByStandardId).map((standardId) => {
                const courses = groupedCoursesByStandardId[standardId];
                return (
                  <div key={standardId} className="flex flex-col space-y-6">
                    <div className="font-medium py-3 border-b border-border">
                      <div className="flex items-center space-x-2">
                        <div>
                          <DotsNineIcon weight="bold" className="w-6 h-6" />
                        </div>
                        <div className="text-base md:text-xl">{getStandardById(standardId)?.name} Courses</div>
                      </div>
                    </div>
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-4 px-4">
                      {courses.map((course) => {
                        return <CourseCard key={course._id} course={course} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      ) : (
        <FullScreenLoader withHeader loading={publicData.isLoading} />
      )}
    </>
  );
};
