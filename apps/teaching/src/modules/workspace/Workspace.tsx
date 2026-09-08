import { DynamicSlider, FullScreenLoader } from '@parthhub/ui/app';
import { Title } from '@components/others';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { AddItem, CourseItem, TestPaperItem, UpcomingSessions } from './components';
import { MaterialItem } from './components/MaterialItem';

export const Workspace = observer(() => {
  const { courseStore, testPaperStore, materialStore, loadHomePageData, isLoadingHomePageData, isLoadedHomePageData } =
    useStores();

  const { courses } = courseStore;
  const { testPapers } = testPaperStore;
  const { materialStats } = materialStore;

  useEffect(() => {
    if (!isLoadedHomePageData && !isLoadingHomePageData) loadHomePageData();
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
});
