import { type IMaterial, type ITestPaper } from '@stores';
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

export const Content = ({ material, testPaper, isFullScreen, onFullScreenChange }: IProps) => {
  return (
    <div className="h-full w-full flex justify-center items-center relative">
      {material && (
        <MaterialItem material={material} isFullScreen={isFullScreen} onFullScreenChange={onFullScreenChange} />
      )}
      {!material && testPaper && <TestPaperItem testPaper={testPaper} />}
    </div>
  );
};
