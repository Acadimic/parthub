import { FullScreenModal } from '@repo/ui/app';
import { TestPaperCard } from '@modules/test-papers/components/TestPaperCard';
import { type ITestPaper } from '@stores';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Lazy and outside the `@layouts` barrel: the exam pulls in KaTeX and the result charts, and `_app`
// imports that barrel, so a static import put both on every page.
const ExamLayout = dynamic(() => import('@layouts/ExamLayout').then((m) => m.ExamLayout));

interface IProps {
  testPaper: ITestPaper;
}

export const TestPaperItem = ({ testPaper }: IProps) => {
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
    <div className="w-full max-w-md p-4">
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
};
