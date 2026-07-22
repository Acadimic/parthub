import { IMaterial, ITestPaper } from '@stores';
import { observer } from 'mobx-react-lite';
import { MaterialItem } from './MaterialItem';
import { TestPaperItem } from './TestPaperItem';

interface IProps {
  courseId: string;
  courseModuleId: string;
  material?: IMaterial;
  testPaper?: ITestPaper;
}

export const Content = observer(({ material, testPaper, courseId, courseModuleId }: IProps) => {
  return (
    <div className="h-full w-full flex justify-center items-center relative">
      {material ? <MaterialItem material={material} /> : testPaper ? <TestPaperItem testPaper={testPaper} /> : null}
    </div>
  );
});
