import { useLoadOnce } from '@repo/ui/hooks';
import { Button, RectangleSkeleton } from '@repo/ui/app';
import { PresignedImage } from '@components/app/attachments';
import { BlankState, Container } from '@components/others';
import { type ICourseFilter } from '@interfaces';
import { XIcon } from '@phosphor-icons/react';
import { type ICourse, useCourseLookups, useCourseStore, useSelectedUser, useStandardLookups } from '@stores';
import { getPlural } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSetState } from 'react-use';
import { ContinueLearning } from './components/ContinueLearning';
import { CourseCard } from './components/CourseCard';
import { CourseFilters } from './components/CourseFilters';

interface IProps {
  /** The catalogue page carries the filter bar; the home page shows the catalogue whole. */
  isFilter: boolean;
  /** The catalogue page has its own title; the home page provides one of its own. */
  withHeading: boolean;
}

const NO_FILTER: ICourseFilter = { standards: [], subjects: [] };

const CARD_GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3';

const CourseGridSkeleton = () => (
  <div className={CARD_GRID}>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="aspect-[16/9] w-full">
          <RectangleSkeleton />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <RectangleSkeleton height={18} width="75%" />
          <RectangleSkeleton height={12} width="95%" />
          <RectangleSkeleton height={12} width="60%" />
          <div className="mt-1 flex gap-3">
            <RectangleSkeleton height={12} width={60} />
            <RectangleSkeleton height={12} width={70} />
            <RectangleSkeleton height={12} width={50} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** Case-insensitive match on the name or the description. */
const matchesQuery = (course: ICourse, q: string) => {
  const needle = q.toLowerCase();
  return course.name.toLowerCase().includes(needle) || (course.description ?? '').toLowerCase().includes(needle);
};

/** A course's item count, from the rollups the catalogue already carries. */
const getCourseTotal = (course: ICourse) =>
  (course.stats?.videosCount ?? 0) + (course.stats?.readingsCount ?? 0) + (course.stats?.testsCount ?? 0);

/** A section shows this many cards before it asks to be expanded, so one big standard cannot bury the rest. */
const SECTION_PREVIEW = 6;

/** One standard's courses, collapsed to a preview row or two until the learner asks for all of them. */
const CourseSection = ({
  standardId,
  courses,
  getProgress,
}: {
  standardId: string;
  courses: ICourse[];
  getProgress: (course: ICourse) => number | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = courses.length > SECTION_PREVIEW;
  const visible = isExpanded || !hasMore ? courses : courses.slice(0, SECTION_PREVIEW);
  return (
    <section className="flex flex-col gap-4 md:gap-5">
      <SectionHeading standardId={standardId} count={courses.length} />
      <div className={CARD_GRID}>
        {visible.map((course) => (
          <CourseCard key={course._id} course={course} progress={getProgress(course)} />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <Button isSecondary onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Show fewer' : `Show all ${courses.length} courses`}
          </Button>
        </div>
      ) : null}
    </section>
  );
};

const SectionHeading = ({ standardId, count }: { standardId: string; count: number }) => {
  const { getStandardById } = useStandardLookups();
  const standard = getStandardById(standardId);
  return (
    <div className="flex items-center gap-3">
      {standard?.logo ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
          <PresignedImage url={standard.logo} className="object-contain" noOpen />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold md:text-xl">{standard?.name ?? 'Courses'}</h2>
        <div className="text-xs text-muted-foreground">
          {count} {getPlural(count, 'course')}
        </div>
      </div>
    </div>
  );
};

/**
 * The learner's started courses, then the catalogue page's own title. The home page shows those
 * above the catalogue itself, and a search is after something new, so neither shows them here.
 */
const CatalogueHeading = ({ countLabel, isSearching }: { countLabel: string; isSearching: boolean }) => (
  <>
    {isSearching ? null : <ContinueLearning className="pb-4 md:pb-6" />}
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Courses</h1>
      <p className="text-muted-foreground">{countLabel}</p>
    </div>
  </>
);

export const Courses = ({ isFilter, withHeading }: IProps) => {
  const courseStore = useCourseLookups();
  const { getCompletedModules, loadCompletedModules } = courseStore;
  const selectedUser = useSelectedUser();
  const { query, push } = useRouter();
  const [filter, setFilter] = useSetState<ICourseFilter>(NO_FILTER);
  const { isLoading, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const q = isFilter && typeof query.q === 'string' ? query.q.trim() : '';

  // The header's Explore menu links here with `?standard=`; it seeds the chip row so the two agree.
  useEffect(() => {
    if (!isFilter) return;
    const standard = typeof query.standard === 'string' ? query.standard : '';
    const subject = typeof query.subject === 'string' ? query.subject : '';
    setFilter({ standards: standard ? [standard] : [], subjects: subject ? [subject] : [] });
  }, [isFilter, query.standard, query.subject]);

  // Progress on the cards needs the learner's completions, which only a signed-in user has.
  useEffect(() => {
    if (selectedUser && !selectedUser.isLoadedCompletedModules) loadCompletedModules();
  }, [selectedUser?._id]);

  const completedByCourse = getCompletedModules().reduce<Record<string, number>>((counts, row) => {
    if (row.isCompleted) counts[row.course] = (counts[row.course] ?? 0) + 1;
    return counts;
  }, {});

  const getProgress = (course: ICourse): number | null => {
    const completed = completedByCourse[course._id] ?? 0;
    if (!completed) return null;
    const total = getCourseTotal(course);
    return total ? Math.min(100, (completed / total) * 100) : 0;
  };

  const grouped = courseStore.getGroupedCoursesByStandardId(isFilter ? filter : undefined);
  const groupedCoursesByStandardId = q
    ? Object.entries(grouped).reduce<Record<string, ICourse[]>>((result, [standardId, courses]) => {
        const matched = courses.filter((course) => matchesQuery(course, q));
        if (matched.length) result[standardId] = matched;
        return result;
      }, {})
    : grouped;

  const standardIds = Object.keys(groupedCoursesByStandardId);
  const totalCount = standardIds.reduce((sum, id) => sum + groupedCoursesByStandardId[id].length, 0);
  const isFiltering = Boolean(filter.standards.length || filter.subjects.length || q);

  const clearQuery = () => push({ pathname: '/courses', query: {} });

  const renderCourses = () => {
    if (isFailed) {
      return <BlankState label="Could not load courses" description={error || 'Please try again in a moment.'} />;
    }
    if (isLoading) return <CourseGridSkeleton />;
    if (standardIds.length === 0) {
      return isFiltering ? (
        <BlankState
          className="py-16"
          label={q ? `No courses match “${q}”` : 'No courses match these filters'}
          description="Try another search, or clear a filter to see more courses."
          action={
            <Button
              isSecondary
              onClick={q ? clearQuery : () => setFilter(NO_FILTER)}
              leftsection={<XIcon weight="bold" className="h-4 w-4" />}
            >
              {q ? 'Clear search' : 'Clear filters'}
            </Button>
          }
        />
      ) : (
        <BlankState
          className="py-16"
          label="No courses yet"
          description="Published courses will appear here as soon as they are available."
        />
      );
    }
    return (
      <div className="flex flex-col gap-10 md:gap-12">
        {standardIds.map((standardId) => (
          <CourseSection
            key={standardId}
            standardId={standardId}
            courses={groupedCoursesByStandardId[standardId]}
            getProgress={getProgress}
          />
        ))}
      </div>
    );
  };

  return (
    <Container>
      <div className="flex flex-col gap-6 py-6 md:py-8">
        {withHeading ? (
          <CatalogueHeading
            countLabel={
              isLoading ? 'Loading the catalogue…' : `${totalCount} ${getPlural(totalCount, 'course')} to choose from.`
            }
            isSearching={Boolean(q)}
          />
        ) : null}
        {isFilter && !isLoading && !isFailed ? <CourseFilters filter={filter} onChange={setFilter} /> : null}
        {q ? (
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">
              Results for <span className="text-primary">“{q}”</span>
            </h2>
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
