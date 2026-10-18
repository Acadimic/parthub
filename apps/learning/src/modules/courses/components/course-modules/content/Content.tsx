import { Button, FullScreenModal } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { BlankState } from '@components/others';
import { FullScreenBar, FullScreenStrip } from '@components/tools';
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

  const placeholder = moduleRequest.isFailed ? (
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
  ) : (
    <div className="flex h-full w-full animate-pulse self-start" aria-busy="true" aria-label="Loading the lesson">
      <LessonBodySkeleton />
    </div>
  );

  const getMaterialView = (lesson: IMaterial) => {
    if (isModuleLoaded) {
      return <MaterialItem material={lesson} isFullScreen={isFullScreen} onFullScreenChange={onFullScreenChange} />;
    }
    // In full screen the viewer owns the overlay, so while the next module loads this holds one of
    // its own; without it the page flashes through until the lesson arrives.
    return (
      <>
        {placeholder}
        <FullScreenModal
          isOpen={isFullScreen}
          onClose={() => onFullScreenChange(false)}
          component={
            <div className="flex h-full w-full flex-col" data-reader-surface="">
              <FullScreenStrip />
              <div className="min-h-0 w-full flex-1 overflow-hidden px-4 pt-6 md:px-8">
                <div className="mx-auto h-full w-full max-w-4xl">{placeholder}</div>
              </div>
              <FullScreenBar onExit={() => onFullScreenChange(false)} />
            </div>
          }
        />
      </>
    );
  };

  return (
    <div className="h-full w-full flex justify-center items-center relative">
      {material && getMaterialView(material)}
      {!material && testPaper && (
        <TestPaperItem testPaper={testPaper} isFullScreen={isFullScreen} onFullScreenChange={onFullScreenChange} />
      )}
    </div>
  );
};
