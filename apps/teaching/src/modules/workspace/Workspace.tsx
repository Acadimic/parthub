import { DynamicSlider, FullScreenLoader } from '@repo/ui/app';
import { useCourseLookups, useMaterialLookups, useMeetLookups, useSelectedUser, useTestPaperLookups } from '@stores';
import { useEffect } from 'react';
import {
  AddItem,
  CourseItem,
  MaterialItem,
  SectionHeader,
  TestPaperItem,
  UpcomingSessions,
  WorkspaceSummary,
} from './components';

/** How many tiles a row shows before "View all" is the better route. */
const ROW_LIMIT = 5;

const greet = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const Workspace = () => {
  const courseStore = useCourseLookups();
  const testPaperStore = useTestPaperLookups();
  const materialStore = useMaterialLookups();
  const meetStore = useMeetLookups();
  const selectedUser = useSelectedUser();

  const courses = courseStore.getCourses();
  const testPapers = testPaperStore.getTestPapers();
  // Derived from the materials the store holds — `material/all` returns rows, not roll-ups.
  const materialStats = materialStore.getMaterialStats();
  const todaysSessions = meetStore.getTodaysScheduledMeets();

  // The root store's `loadHomePageData` fanned out to these four. With the root store gone the
  // composition belongs to the screen that needs it, and each store reports its own status.
  const isLoadingHomePageData =
    courseStore.isLoading('courses') ||
    testPaperStore.isLoading('testPapers') ||
    materialStore.isLoading('materialStats') ||
    meetStore.isLoading('meets');

  useEffect(() => {
    if (courseStore.shouldLoad('courses')) courseStore.loadCourses();
    if (testPaperStore.shouldLoad('testPapers')) testPaperStore.loadTestPapers();
    if (materialStore.shouldLoad('materialStats')) materialStore.loadMaterialStats();
    if (meetStore.shouldLoad('meets')) meetStore.loadMeets();
    // Once on mount, like the root store's fan-out did.
  }, []);

  if (isLoadingHomePageData) return <FullScreenLoader withHeader loading />;

  const courseItems = courses.slice(0, ROW_LIMIT).map((course) => <CourseItem key={course._id} course={course} />);
  const testPaperItems = testPapers
    .slice(0, ROW_LIMIT)
    .map((testPaper) => <TestPaperItem key={testPaper._id} testPaper={testPaper} />);
  const materialItems = materialStats
    .slice(0, ROW_LIMIT)
    .map((materialStat) => (
      <MaterialItem key={materialStat.standard + materialStat.subject} materialStat={materialStat} />
    ));

  // The first name only — "Good morning, Priya Sharma" reads like a form letter.
  const firstName = selectedUser?.name?.trim().split(' ')[0];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 pb-16">
      <header>
        <h1 className="text-2xl font-bold">
          {greet()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here is what is happening in your workspace today.</p>
      </header>

      <WorkspaceSummary
        courseCount={courses.length}
        testPaperCount={testPapers.length}
        materialCount={materialStats.length}
        sessionCount={todaysSessions.length}
      />

      <section>
        <SectionHeader title="Today's Sessions" count={todaysSessions.length} href="/sessions" />
        <UpcomingSessions />
      </section>

      <section>
        <SectionHeader title="Courses" count={courses.length} href="/courses" />
        <DynamicSlider
          items={[...courseItems, <AddItem key="add-course" href="/courses?add=true" text="Add Course" />]}
          showDots={false}
          autoPlay={false}
        />
      </section>

      <section>
        <SectionHeader title="Test Papers" count={testPapers.length} href="/test-papers" />
        <DynamicSlider
          items={[
            ...testPaperItems,
            <AddItem key="add-test-paper" href="/test-papers?add=true" text="Add Test Paper" />,
          ]}
          showDots={false}
          autoPlay={false}
        />
      </section>

      <section>
        <SectionHeader title="Study Materials" count={materialStats.length} href="/study-materials" />
        <DynamicSlider
          items={[
            ...materialItems,
            <AddItem key="add-material" href="/study-materials?add=true" text="Add Study Material" />,
          ]}
          showDots={false}
          autoPlay={false}
        />
      </section>
    </div>
  );
};
