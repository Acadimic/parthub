import { type IMaterial, type ITestPaper } from '@stores';
import { MaterialItem } from './MaterialItem';
import { TestPaperItem } from './TestPaperItem';

interface IProps {
  courseId: string;
  courseModuleId: string;
  material?: IMaterial;
  testPaper?: ITestPaper;
}

export const Content = ({ material, testPaper }: IProps) => {
  return (
    <div className="h-full w-full flex justify-center items-center relative">
      {material && <MaterialItem material={material} />}
      {!material && testPaper && <TestPaperItem testPaper={testPaper} />}
    </div>
  );
};
