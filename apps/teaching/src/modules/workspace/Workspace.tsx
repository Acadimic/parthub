import { useLoadOnce } from '@repo/ui/hooks';
import { RectangleSkeleton } from '@repo/ui/app';
import {
  useBatchLookups,
  useCourseLookups,
  useMaterialLookups,
  useMeetLookups,
  useSelectedUser,
  useTestPaperLookups,
  useUserLookups,
  useUserStore,
} from '@stores';
import { addDaysToDate, getEndOfWeek, getFullCalendarEvents, getStartOfWeek } from '@utils/helpers';
import { useEffect } from 'react';
import {
  AddItem,
  CourseItem,
  DoubtsToAnswer,
  GettingStarted,
  type ISetupStep,
  MaterialItem,
  SectionHeader,
  TestPaperItem,
  UpcomingSessions,
  WeekActivity,
  WorkspaceHero,
  WorkspaceSummary,
} from './components';

/** How many tiles a row shows before "View all" is the better route. */
const ROW_LIMIT = 3;

const WorkspaceSkeleton = () => (
  <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your workspace">
    <RectangleSkeleton height={140} width="100%" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <RectangleSkeleton key={index} height={64} width="100%" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <RectangleSkeleton height={260} width="100%" />
      </div>
      <RectangleSkeleton height={260} width="100%" />
    </div>
  </div>
);

export const Workspace = () => {
  // The org's people are loaded by each screen that shows them; nothing loads them up front.
  useLoadOnce(useUserStore, 'users', (state) => state.loadUsers);
  const courseStore = useCourseLookups();
  const testPaperStore = useTestPaperLookups();
  const materialStore = useMaterialLookups();
  const meetStore = useMeetLookups();
  const userStore = useUserLookups();
  const batchStore = useBatchLookups();
  const selectedUser = useSelectedUser();

  const courses = courseStore.getCourses().filter((course) => !course.isNew);
  const testPapers = testPaperStore.getTestPapers().filter((paper) => !paper.isNew);
  // Derived from the materials the store holds — `material/all` returns rows, not roll-ups.
  const materialStats = materialStore.getMaterialStats();
  const meets = meetStore.getMeets().filter((meet) => !meet.isNew);
  const students = userStore.getStudents();
  const batches = batchStore.getBatches();
  const todaysSessions = meetStore.getTodaysScheduledMeets();

  const weekStart = getStartOfWeek(new Date());
  const weekSessionCount = meets.reduce(
    (total, meet) => total + getFullCalendarEvents(meet, weekStart, getEndOfWeek(new Date())).length,
    0,
  );
  const hasUpcoming = meets.some(
    (meet) => getFullCalendarEvents(meet, new Date(), addDaysToDate(new Date(), 30)).length,
  );

  // The root store's `loadHomePageData` fanned out to these. With the root store gone the
  // composition belongs to the screen that needs it, and each store reports its own status.
  const isLoading =
    courseStore.isLoading('courses') ||
    testPaperStore.isLoading('testPapers') ||
    materialStore.isLoading('materialStats') ||
    meetStore.isLoading('meets');

  useEffect(() => {
    if (courseStore.shouldLoad('courses')) courseStore.loadCourses();
    if (testPaperStore.shouldLoad('testPapers')) testPaperStore.loadTestPapers();
    if (materialStore.shouldLoad('materialStats')) materialStore.loadMaterialStats();
    if (meetStore.shouldLoad('meets')) meetStore.loadMeets();
    if (batchStore.shouldLoad('batchesData')) batchStore.loadBatchesData();
    // Once on mount, like the root store's fan-out did.
  }, []);

  if (isLoading) return <WorkspaceSkeleton />;

  const steps: ISetupStep[] = [
    { label: 'Invite your first students', href: '/students', isDone: students.length > 0 },
    { label: 'Group them into a batch', href: '/batches', isDone: batches.length > 0 },
    { label: 'Add study material for a subject', href: '/study-materials?add=true', isDone: materialStats.length > 0 },
    { label: 'Create a test paper', href: '/test-papers?add=true', isDone: testPapers.length > 0 },
    { label: 'Build a course from them', href: '/courses?add=true', isDone: courses.length > 0 },
    { label: 'Schedule a live session', href: '/calender?add=true', isDone: hasUpcoming },
  ];
  const isSetUp = steps.every((step) => step.isDone);

  // The first name only — "Good morning, Priya Sharma" reads like a form letter.
  const firstName = selectedUser?.name?.trim().split(' ')[0];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-16">
      <WorkspaceHero firstName={firstName} todayCount={todaysSessions.length} />

      <WorkspaceSummary
        studentCount={students.length}
        batchCount={batches.length}
        courseCount={courses.length}
        testPaperCount={testPapers.length}
        publishedTestPaperCount={testPapers.filter((paper) => paper.isPublished).length}
        materialCount={materialStats.length}
        weekSessionCount={weekSessionCount}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader title="Upcoming sessions" hint="The next seven days, soonest first." href="/sessions" />
          <UpcomingSessions />
        </section>
        <div className="flex flex-col gap-4">
          <DoubtsToAnswer />
          <WeekActivity meets={meets} />
          {!isSetUp ? <GettingStarted steps={steps} /> : null}
        </div>
      </div>

      <section>
        <SectionHeader title="Courses" count={courses.length} href="/courses" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {courses.slice(0, ROW_LIMIT).map((course) => (
            <CourseItem key={course._id} course={course} />
          ))}
          <AddItem href="/courses?add=true" text="Add course" />
        </div>
      </section>

      <section>
        <SectionHeader title="Test papers" count={testPapers.length} href="/test-papers" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {testPapers.slice(0, ROW_LIMIT).map((testPaper) => (
            <TestPaperItem key={testPaper._id} testPaper={testPaper} />
          ))}
          <AddItem href="/test-papers?add=true" text="Create test paper" />
        </div>
      </section>

      <section>
        <SectionHeader title="Study materials" count={materialStats.length} href="/study-materials" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {materialStats.slice(0, ROW_LIMIT).map((materialStat) => (
            <MaterialItem key={materialStat.standard + materialStat.subject} materialStat={materialStat} />
          ))}
          <AddItem href="/study-materials?add=true" text="Add study material" />
        </div>
      </section>
    </div>
  );
};
