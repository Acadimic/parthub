import { FullScreenModal } from '@repo/ui/app';
import { FullScreenBar } from '@components/tools';
import { TestPaperCard } from '@modules/test-papers/components/TestPaperCard';
import { type ITestPaper } from '@stores';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Lazy and outside the `@layouts` barrel: the exam pulls in KaTeX and the result charts, and `_app`
// imports that barrel, so a static import put both on every page.
const ExamLayout = dynamic(() => import('@layouts/ExamLayout').then((m) => m.ExamLayout));

interface IProps {
  testPaper: ITestPaper;
  /** The frame's full-screen state, as for a lesson; the exam opens its own sitting over it. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const TestPaperItem = ({ testPaper, isFullScreen, onFullScreenChange }: IProps) => {
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

  const card = <TestPaperCard paper={testPaper} handleOpen={handleOpenTestPaper} />;

  return (
    <div className="w-full max-w-md p-4">
      {card}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => onFullScreenChange(false)}
        component={
          <div className="flex h-full w-full flex-col" data-reader-surface="">
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto p-4">{card}</div>
            <FullScreenBar onExit={() => onFullScreenChange(false)} />
          </div>
        }
      />
      {/* After the frame's modal in the tree, so the exam sits over it at the same layer. */}
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
