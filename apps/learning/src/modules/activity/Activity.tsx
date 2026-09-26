import { Breadcrumb, Link } from '@repo/ui/app';
import { Tabs } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { BlankState, Container } from '@components/others';
import { useActivity } from '@hooks/activity.hook';
import { ChartLineUpIcon, ClipboardTextIcon, GearSixIcon, ListDashesIcon } from '@phosphor-icons/react';
import { useCourseLookups, useCourseStore, useTestPaperStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import {
  ActivityHeatmap,
  ActivitySkeleton,
  ActivitySummary,
  ActivityTimeline,
  AttemptsTable,
  CourseProgressCards,
} from './components';

const VIEWS = ['overview', 'timeline', 'tests'] as const;
type View = (typeof VIEWS)[number];

const isView = (value: unknown): value is View => VIEWS.includes(value as View);

/**
 * The learner's own record: what they have finished, how their tests went, and when they were
 * active. Three views of the same events — a summary, a day-by-day timeline, and a table of
 * attempts — chosen through `?view=`, so a view can be linked to.
 */
export const Activity = () => {
  const { query, replace } = useRouter();
  const { getCourseById, loadCourseModules } = useCourseLookups();
  const coursesRequest = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const completedRequest = useLoadOnce(useCourseStore, 'completedModules', (state) => state.loadCompletedModules);
  const resultsRequest = useLoadOnce(useTestPaperStore, 'results', (state) => state.loadMyResults);
  const { events, attempts, courses, summary, days } = useActivity();
  const requestedContents = useRef(new Set<string>());
  const view: View = isView(query.view) ? query.view : 'overview';

  // A completed lesson is only an id until its course's contents are in the store; fetch them for
  // every course the learner has touched, once each.
  useEffect(() => {
    courses.forEach((row) => {
      const course = getCourseById(row.courseId);
      if (!course || course.isLoadedContents || requestedContents.current.has(row.courseId)) return;
      requestedContents.current.add(row.courseId);
      loadCourseModules(row.courseId);
    });
  }, [courses.length]);

  const isLoading = coursesRequest.isLoading || completedRequest.isLoading || resultsRequest.isLoading;
  const failed = [coursesRequest, completedRequest, resultsRequest].find((request) => request.isFailed);

  const setView = (index: number) => {
    replace({ pathname: '/activity', query: { view: VIEWS[index] } }, undefined, { shallow: true });
  };

  const renderBody = () => {
    if (failed) {
      return <BlankState label="Could not load your activity" description={failed.error || 'Please try again.'} />;
    }
    if (isLoading) return <ActivitySkeleton />;
    if (!events.length && !courses.length) {
      return (
        <BlankState
          className="py-16"
          label="No activity yet"
          description="Finish a lesson or sit a test paper and it will show up here."
          action={
            <Link href="/courses" isSecondary>
              Browse courses
            </Link>
          }
        />
      );
    }
    return (
      <Tabs
        value={VIEWS.indexOf(view)}
        onChange={setView}
        contentClassName="pt-6"
        tabs={[
          {
            label: 'Overview',
            icon: <ChartLineUpIcon weight="bold" className="h-4 w-4" />,
            component: (
              <div className="flex flex-col gap-8">
                <ActivitySummary summary={summary} />
                <ActivityHeatmap days={days} />
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">Your courses</h2>
                  <CourseProgressCards courses={courses} />
                </section>
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent activity</h2>
                    <Link href="/activity?view=timeline" isSubtle className="px-2 py-1 text-sm text-primary">
                      See all
                    </Link>
                  </div>
                  <ActivityTimeline events={events.slice(0, 5)} />
                </section>
              </div>
            ),
          },
          {
            label: 'Timeline',
            icon: <ListDashesIcon weight="bold" className="h-4 w-4" />,
            component: <ActivityTimeline events={events} />,
          },
          {
            label: 'Tests',
            icon: <ClipboardTextIcon weight="bold" className="h-4 w-4" />,
            component: <AttemptsTable attempts={attempts} />,
          },
        ]}
      />
    );
  };

  return (
    <Container>
      <div className="py-4 md:py-8">
        {/* On a phone the page is reached from Account, so the trail back is shown there. */}
        <div className="mb-3 md:hidden">
          <Breadcrumb
            items={[
              { label: 'Account', href: '/account-settings', icon: <GearSixIcon weight="bold" className="h-3 w-3" /> },
              { label: 'Activity', href: '/activity', icon: <ChartLineUpIcon weight="bold" className="h-3 w-3" /> },
            ]}
          />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Your activity</h1>
          <p className="mt-1 text-muted-foreground">What you have learned, how your tests went, and when.</p>
        </div>
        {renderBody()}
      </div>
    </Container>
  );
};
