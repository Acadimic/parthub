import { ITestPaper } from '@stores';
import { observer } from 'mobx-react-lite';
import { TestPaperCard } from './components/TestPaperCard';

interface IProps {
  papers: ITestPaper[];
}

export const TestPapers = observer(({ papers }: IProps) => {
  return (
    <div className="h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {papers.map((paper) => {
        return <TestPaperCard key={paper._id} paper={paper} handleOpen={() => {}} />;
      })}
    </div>
  );
});
