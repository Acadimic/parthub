import { useLoadOnce } from '@repo/ui/hooks';
import { Button, RectangleSkeleton } from '@repo/ui/app';
import { BlankState, Container } from '@components/others';
import { XIcon } from '@phosphor-icons/react';
import { type ICourseFilter } from '@interfaces';
import { type ICourse, useCourseLookups, useCourseStore, useStandardLookups } from '@stores';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { CourseCard } from './components/CourseCard';
import { CourseFilters } from './components/CourseFilters';

interface IProps {
  isFilter?: boolean;
}

const NO_FILTER: ICourseFilter = { standards: [], subjects: [] };

const CourseGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex flex-col gap-3 rounded-xl border border-border p-3">
        <RectangleSkeleton height={160} />
        <RectangleSkeleton height={16} width="70%" />
        <RectangleSkeleton height={12} width="90%" />
        <RectangleSkeleton height={12} width="50%" />
      </div>
    ))}
  </div>
);

/** Case-insensitive match on the name or the description. */
const matchesQuery = (course: ICourse, q: string) => {
  const needle = q.toLowerCase();
  return course.name.toLowerCase().includes(needle) || (course.description ?? '').toLowerCase().includes(needle);
};

export const Courses = ({ isFilter }: IProps) => {
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const { query, push } = useRouter();
  const [filter, setFilter] = useSetState<ICourseFilter>(NO_FILTER);
  const { getStandardById, getSubjectsByIds } = standardStore;
  const { isLoading, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const q = isFilter && typeof query.q === 'string' ? query.q.trim() : '';

  // The header's Explore menu links here with `?standard=`; it seeds the chip row so the two agree.
  useEffect(() => {
    if (!isFilter) return;
    const standard = typeof query.standard === 'string' ? query.standard : '';
    const subject = typeof query.subject === 'string' ? query.subject : '';
    setFilter({ standards: standard ? [standard] : [], subjects: subject ? [subject] : [] });
  }, [isFilter, query.standard, query.subject]);

  // The home page shows the catalogue whole, so it passes no filters and gets no filter bar.
  const grouped = courseStore.getGroupedCoursesByStandardId(isFilter ? filter : undefined);
  const groupedCoursesByStandardId = q
    ? Object.entries(grouped).reduce<Record<string, ICourse[]>>((result, [standardId, courses]) => {
        const matched = courses.filter((course) => matchesQuery(course, q));
        if (matched.length) result[standardId] = matched;
        return result;
      }, {})
    : grouped;

  const standardIds = Object.keys(groupedCoursesByStandardId);
  const isFiltering = Boolean(filter.standards.length || filter.subjects.length || q);

  const clearQuery = () => push({ pathname: '/courses', query: {} });
  const subjectNames = getSubjectsByIds(filter.subjects).map((subject) => subject.name);

  const renderCourses = () => {
    if (isFailed) {
      return <BlankState label="Could not load courses" description={error || 'Please try again in a moment.'} />;
    }
    if (isLoading) return <CourseGridSkeleton />;
    if (standardIds.length === 0) {
      return isFiltering ? (
        <BlankState
          label={q ? `No courses match “${q}”` : 'No courses match these filters'}
          description="Try another search, or clear a filter to see more courses."
          action={
            q ? (
              <Button isSecondary onClick={clearQuery} leftsection={<XIcon weight="bold" className="h-4 w-4" />}>
                Clear search
              </Button>
            ) : null
          }
        />
      ) : (
        <BlankState
          label="No courses yet"
          description="Published courses will appear here as soon as they are available."
        />
      );
    }
    return (
      <div className="flex flex-col gap-12">
        {standardIds.map((standardId) => {
          const courses = groupedCoursesByStandardId[standardId];
          return (
            <section key={standardId} className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
                <h2 className="text-base font-semibold md:text-xl">{getStandardById(standardId)?.name} courses</h2>
                <span className="shrink-0 text-xs text-muted-foreground">{courses.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <Container>
      <div className="py-6">
        {isFilter && !isLoading && !isFailed ? <CourseFilters filter={filter} onChange={setFilter} /> : null}
        {q || subjectNames.length ? (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold">
              {q ? (
                <>
                  Results for <span className="text-primary">“{q}”</span>
                </>
              ) : (
                <>
                  Subject: <span className="text-primary">{subjectNames.join(', ')}</span>
                </>
              )}
            </h1>
            <Button
              isSubtle
              className="px-2 py-1 text-xs"
              onClick={clearQuery}
              leftsection={<XIcon weight="bold" className="h-3.5 w-3.5" />}
            >
              Clear
            </Button>
          </div>
        ) : null}
        {renderCourses()}
      </div>
    </Container>
  );
};
