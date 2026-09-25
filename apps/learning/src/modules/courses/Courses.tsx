import { useLoadOnce } from '@repo/ui/hooks';
import { RectangleSkeleton } from '@repo/ui/app';
import { BlankState, Container } from '@components/others';
import { DotsNineIcon } from '@phosphor-icons/react';
import { type ICourseFilter } from '@interfaces';
import { useCourseLookups, useCourseStore, useStandardLookups } from '@stores';
import { useSetState } from 'react-use';
import { CourseCard } from './components/CourseCard';
import { CourseFilters } from './components/CourseFilters';

interface IProps {
  isFilter?: boolean;
}

const NO_FILTER: ICourseFilter = { standards: [], subjects: [] };

const CourseGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <RectangleSkeleton key={index} height={220} />
    ))}
  </div>
);

export const Courses = ({ isFilter }: IProps) => {
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const [filter, setFilter] = useSetState<ICourseFilter>(NO_FILTER);
  const { getStandardById } = standardStore;
  // Nothing used to start this fetch, so the grid rendered whatever happened to be in the store —
  // which, on a fresh visit, was nothing.
  const { isLoading, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  // The home page shows the catalogue whole, so it passes no filters and gets no filter bar.
  const groupedCoursesByStandardId = courseStore.getGroupedCoursesByStandardId(isFilter ? filter : undefined);

  const standardIds = Object.keys(groupedCoursesByStandardId);
  const isFiltering = Boolean(filter.standards.length || filter.subjects.length);

  // Three states, where there used to be one: the grid rendered nothing at all while the request
  // was in flight, and nothing at all when it came back empty.
  const renderCourses = () => {
    if (isFailed) {
      return <BlankState label="Could not load courses" description={error || 'Please try again in a moment.'} />;
    }
    if (isLoading) return <CourseGridSkeleton />;
    if (standardIds.length === 0) {
      return isFiltering ? (
        <BlankState label="No courses match these filters" description="Clear a filter to see more courses." />
      ) : (
        <BlankState
          label="No courses yet"
          description="Published courses will appear here as soon as they are available."
        />
      );
    }
    return (
      <div className="flex flex-col space-y-12">
        {standardIds.map((standardId) => {
          const courses = groupedCoursesByStandardId[standardId];
          return (
            <div key={standardId} className="flex flex-col space-y-6">
              <div className="border-b border-border py-3 font-medium">
                <div className="flex items-center space-x-2">
                  <div>
                    <DotsNineIcon weight="bold" className="h-6 w-6" />
                  </div>
                  <div className="text-base md:text-xl">{getStandardById(standardId)?.name} Courses</div>
                </div>
              </div>
              <div className="grid h-full grid-cols-1 gap-6 px-4 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
                {courses.map((course) => {
                  return <CourseCard key={course._id} course={course} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Container>
      <div className="py-6">
        {isFilter && !isLoading && !isFailed ? <CourseFilters filter={filter} onChange={setFilter} /> : null}
        {renderCourses()}
      </div>
    </Container>
  );
};
