import { Button } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { BlankState } from '@components/others';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { type IMaterial, type ITestPaper, useCourseStore } from '@stores';
import { LessonBodySkeleton } from '../../CourseSkeleton';
import { MaterialItem } from './MaterialItem';
import { TestPaperItem } from './TestPaperItem';

interface IProps {
  courseId: string;
  courseModuleId: string;
  material?: IMaterial;
  testPaper?: ITestPaper;
  /** The frame's full-screen state; the toggle lives in the frame's toolbar, not in the viewer. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const Content = ({
  courseId,
  courseModuleId,
  material,
  testPaper,
  isFullScreen,
  onFullScreenChange,
}: IProps) => {
  // The course opens on its outline, so a lesson's body arrives with its module. Until then the
  // lesson would read as empty, which is why it waits here rather than in the viewer.
  const isModuleLoaded = useCourseStore((state) => !!state.courseModuleMap[courseModuleId]?.isLoadedContents);
  const moduleRequest = useRequest(useCourseStore, 'moduleContents');

  const getMaterialView = (lesson: IMaterial) => {
    if (isModuleLoaded) {
      return <MaterialItem material={lesson} isFullScreen={isFullScreen} onFullScreenChange={onFullScreenChange} />;
    }
    if (moduleRequest.isFailed) {
      return (
        <BlankState
          className="h-full justify-center"
          label="Could not load this lesson"
          description={moduleRequest.error || 'Something went wrong on our side. Please try again.'}
          action={
            <Button
              isSecondary
              onClick={() => useCourseStore.getState().loadModuleContents(courseId, courseModuleId)}
              leftsection={<ArrowClockwiseIcon weight="bold" className="h-4 w-4" />}
            >
              Try again
            </Button>
          }
        />
      );
    }
    return (
      <div className="flex h-full w-full animate-pulse self-start" aria-busy="true" aria-label="Loading the lesson">
        <LessonBodySkeleton />
      </div>
    );
  };

  return (
    <div className="h-full w-full flex justify-center items-center relative">
      {material && getMaterialView(material)}
      {!material && testPaper && <TestPaperItem testPaper={testPaper} />}
    </div>
  );
};
