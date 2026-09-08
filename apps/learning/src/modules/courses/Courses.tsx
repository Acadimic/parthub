import { FullScreenLoader } from '@repo/ui/app';
import { Container } from '@components/others';
import { DotsNineIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { CourseCard } from './components/CourseCard';

interface IProps {
  isFilter?: boolean;
}

export const Courses = observer(({ isFilter }: IProps) => {
  const { isLoadedPublicData, isLoadingPublicData, courseStore, standardStore } = useStores();
  const { groupedCoursesByStandardId } = courseStore;
  const { getStandardById } = standardStore;

  return (
    <>
      {isLoadedPublicData ? (
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
                    <div className="font-medium py-3 border-b border-color-border">
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
        <FullScreenLoader withHeader loading={isLoadingPublicData} />
      )}
    </>
  );
});
