import { DynamicSlider, FullScreenLoader } from '@repo/ui/app';
import { Title } from '@components/others';
import { useCourseLookups, useMaterialLookups, useMeetLookups, useTestPaperLookups } from '@stores';
import { useEffect } from 'react';
import { AddItem, CourseItem, TestPaperItem, UpcomingSessions } from './components';
import { MaterialItem } from './components/MaterialItem';

export const Workspace = () => {
  const courseStore = useCourseLookups();
  const testPaperStore = useTestPaperLookups();
  const materialStore = useMaterialLookups();
  const meetStore = useMeetLookups();

  const courses = courseStore.getCourses();
  const testPapers = testPaperStore.getTestPapers();
  const { materialStats } = materialStore;

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

  const courseItems = courses.slice(0, 5).map((course) => <CourseItem key={course._id} course={course} />);
  const addCourseItem = <AddItem href="/courses?add=true" text="Add Course" />;

  const testPaperItems = testPapers
    .slice(0, 5)
    .map((testPaper) => <TestPaperItem key={testPaper._id} testPaper={testPaper} />);
  const addTestPaperItem = <AddItem href="/test-papers?add=true" text="Add Test Paper" />;

  const materialItems = materialStats
    .slice(0, 5)
    .map((materialStat) => (
      <MaterialItem key={materialStat.standard + materialStat.subject} materialStat={materialStat} />
    ));
  const addMaterialItem = <AddItem href="/study-materials?add=true" text="Add Study Material" />;

  return (
    <div className="">
      {isLoadingHomePageData ? (
        <FullScreenLoader withHeader loading={isLoadingHomePageData} />
      ) : (
        <div className="flex flex-col gap-12 pb-16">
          <div className="">
            <Title title="Today's Sessions" />
            <UpcomingSessions />
          </div>
          <div className="">
            <Title title="Courses" />
            <DynamicSlider items={[...courseItems, addCourseItem]} showDots={false} autoPlay={false} />
          </div>
          <div>
            <Title title="Test Papers" />
            <DynamicSlider items={[...testPaperItems, addTestPaperItem]} showDots={false} autoPlay={false} />
          </div>
          <div>
            <Title title="Materials" />
            <DynamicSlider items={[...materialItems, addMaterialItem]} showDots={false} autoPlay={false} />
          </div>
        </div>
      )}
    </div>
  );
};
