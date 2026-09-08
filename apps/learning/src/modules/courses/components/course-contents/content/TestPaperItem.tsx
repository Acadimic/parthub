import { FullScreenModal } from '@repo/ui/app';
import { ExamLayout } from '@layouts';
import { TestPaperCard } from '@modules/test-papers/components/TestPaperCard';
import { ITestPaper } from '@stores';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  testPaper: ITestPaper;
}

export const TestPaperItem = observer(({ testPaper }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPractice, setIsPractice] = useState(false);

  const handleOpenTestPaper = (practice?: boolean) => {
    setIsOpen(true);
    setIsPractice(practice || false);
  };

  const handleCloseTestPaper = () => {
    setIsOpen(false);
    setIsPractice(false);
  };

  return (
    <div className="p-4 w-[360px]">
      <TestPaperCard paper={testPaper} handleOpen={handleOpenTestPaper} />
      <FullScreenModal
        isOpen={isOpen}
        component={
          isOpen && (
            <ExamLayout isPractice={isPractice} testPaperId={testPaper._id} onCloseExam={handleCloseTestPaper} />
          )
        }
        onClose={handleCloseTestPaper}
      />
    </div>
  );
});
