import { type MeetDto } from '@repo/shared/contracts';
import { withNextMeetOccurrence } from '@repo/shared/utils';
import { RectangleSkeleton } from '@repo/ui/app';
import { Chip } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { Link } from '@repo/ui/app';
import { BlankState, Container } from '@components/others';
import { useCourseLookups, useCourseStore, useMeetLookups, useMeetStore, useSelectedUser } from '@stores';
import { useEffect, useMemo, useState } from 'react';
import { NextSessionHero } from './components/NextSessionHero';
import { SessionCard } from './components/SessionCard';
import { getNextSession, getSessionState, groupSessions, isSessionOpen, pluralClasses } from './session.utils';

const SkeletonGrid = () => (
  <div className="flex flex-col gap-6">
    <RectangleSkeleton height={220} />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <RectangleSkeleton key={index} height={220} />
      ))}
    </div>
  </div>
);

/** Every course's sessions, with the course it came from and whether the learner is in it. */
interface ICourseMeets {
  courseId: string;
  courseName: string;
  isMine: boolean;
  meets: MeetDto[];
}

/**
 * The learner's live classes. Their own courses come first — the ones they have started or been
 * enrolled in — with the next class pinned at the top, then the classes running in other published
 * courses, which sell the course rather than offer a seat.
 */
export const Sessions = () => {
  const selectedUser = useSelectedUser();
  const { getCourses, getCompletedModules, loadCompletedModules } = useCourseLookups();
  const { getMeetsByIds, loadMeetsByIds, getMyMeetsSorted } = useMeetLookups();
  const coursesRequest = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const myMeetsRequest = useLoadOnce(useMeetStore, 'meets', (state) => state.loadMyMeets);
  const courseMeetsRequest = useMeetLookups();
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    if (selectedUser && !selectedUser.isLoadedCompletedModules) loadCompletedModules();
  }, [selectedUser?._id]);

  // Every id the catalogue's courses point at, fetched in one call once the catalogue is in.
  const courses = getCourses();
  const allMeetIds = useMemo(() => [...new Set(courses.flatMap((course) => course.meets ?? []))], [courses.length]);
  useEffect(() => {
    if (allMeetIds.length && courseMeetsRequest.shouldLoad('courseMeets')) loadMeetsByIds(allMeetIds);
  }, [allMeetIds.join(',')]);

  const now = new Date();
  const startedCourseIds = new Set(getCompletedModules().map((row) => row.course));
  const myMeetIds = new Set(getMyMeetsSorted().map((meet) => meet._id));
  const byCourse: ICourseMeets[] = courses
    .map((course) => {
      // A recurring class is shown as its next sitting, not the first one it was created with.
      const meets = getMeetsByIds(course.meets ?? []).map((meet) => withNextMeetOccurrence(meet, now));
      const isMine = startedCourseIds.has(course._id) || meets.some((meet) => myMeetIds.has(meet._id));
      return { courseId: course._id, courseName: course.name, isMine, meets };
    })
    .filter((entry) => entry.meets.length > 0);

  const mine = byCourse.filter((entry) => entry.isMine);
  const others = byCourse.filter((entry) => !entry.isMine);
  const courseNameOf = (meet: MeetDto) => byCourse.find((entry) => entry.meets.includes(meet))?.courseName ?? '';
  const courseIdOf = (meet: MeetDto) => byCourse.find((entry) => entry.meets.includes(meet))?.courseId ?? '';

  const visibleMine = courseFilter === 'all' ? mine : mine.filter((entry) => entry.courseId === courseFilter);
  const myMeets = visibleMine.flatMap((entry) => entry.meets);
  const next = getNextSession(myMeets);
  const groups = groupSessions(myMeets.filter((meet) => meet._id !== next?._id));
  const upcomingCount = myMeets.filter((meet) => isSessionOpen(getSessionState(meet))).length;
  const otherUpcoming = others
    .flatMap((entry) => entry.meets)
    .filter((meet) => isSessionOpen(getSessionState(meet)))
    .sort((a, b) => new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime())
    .slice(0, 6);

  const isLoading = coursesRequest.isLoading || myMeetsRequest.isLoading || courseMeetsRequest.isLoading('courseMeets');
  const failed = [coursesRequest, myMeetsRequest].find((request) => request.isFailed);

  const renderBody = () => {
    if (failed) {
      return (
        <BlankState
          label="Could not load your sessions"
          description={failed.error || 'Please try again in a moment.'}
        />
      );
    }
    if (isLoading) return <SkeletonGrid />;
    if (!mine.length && !others.length) {
      return (
        <BlankState
          className="py-16"
          label="No live classes yet"
          description="Live classes are scheduled inside courses. Start a course and its classes will appear here."
          action={
            <Link href="/courses" isSecondary>
              Browse courses
            </Link>
          }
        />
      );
    }
    return (
      <div className="flex flex-col gap-10">
        {mine.length ? (
          <>
            {mine.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Chip label="All courses" isSelected={courseFilter === 'all'} onClick={() => setCourseFilter('all')} />
                {mine.map((entry) => (
                  <Chip
                    key={entry.courseId}
                    label={entry.courseName}
                    isSelected={courseFilter === entry.courseId}
                    onClick={() => setCourseFilter(entry.courseId)}
                  />
                ))}
              </div>
            ) : null}
            {next ? <NextSessionHero meet={next} courseId={courseIdOf(next)} courseName={courseNameOf(next)} /> : null}
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">{group.title}</h2>
                  <span className="text-xs text-muted-foreground">
                    {group.meets.length} {pluralClasses(group.meets.length)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.meets.map((meet) => (
                    <SessionCard
                      key={meet._id}
                      meet={meet}
                      courseId={courseIdOf(meet)}
                      courseName={courseNameOf(meet)}
                      isMine
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <BlankState
            label="No live classes in your courses yet"
            description="Start a course with live classes and they will show up here, with the next one pinned at the top."
          />
        )}
        {otherUpcoming.length ? (
          <section className="flex flex-col gap-4 border-t border-border pt-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-caps text-primary">
                Happening across the catalogue
              </div>
              <h2 className="mt-1 text-lg font-semibold">Live classes in courses you could join</h2>
              <p className="text-sm text-muted-foreground">
                Each one comes with its course. Open the course to see the plan and start.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherUpcoming.map((meet) => (
                <SessionCard
                  key={meet._id}
                  meet={meet}
                  courseId={courseIdOf(meet)}
                  courseName={courseNameOf(meet)}
                  isMine={false}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  };

  return (
    <Container>
      <div className="flex flex-col gap-6 py-6 md:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Live classes</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading
              ? 'Loading your schedule…'
              : `${upcomingCount} upcoming ${pluralClasses(upcomingCount)} in your courses. Times are shown in your timezone.`}
          </p>
        </div>
        {renderBody()}
      </div>
    </Container>
  );
};
