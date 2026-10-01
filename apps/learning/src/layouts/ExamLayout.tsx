import { Button, Modal, ModalFooter } from '@repo/ui/app';
import { ExamFooter } from '@components/app/footers';
import { ExamHeader } from '@components/app/headers';
import { ExamFinishButton, ExamSidebar, ExamSkeleton, Instruction } from '@components/exam';
import { BlankState } from '@components/others';
import { useExam } from '@hooks/exam.hook';
import { TestPaperSummary } from '@modules/test-papers/components/TestPaperSummary';
import { Exam } from '@modules/test-papers/Exam';
import { useSelectorLookups, useTestPaperLookups } from '@stores';
import { useEffect, useState } from 'react';

interface IProps {
  testPaperId: string;
  isPractice: boolean;
  onCloseExam: () => void;
}

/**
 * Whether the sitting on screen is this paper's, and whether it is still on its way. Before the
 * load effect has run the request is idle and `exam` is empty or a previous paper's, so neither may
 * show the not-found state: the skeleton stays up until this paper's load has settled.
 */
const getExamReadiness = (store: ReturnType<typeof useTestPaperLookups>, testPaperId: string) => {
  const isThisExam = store.exam?.testPaper === testPaperId;
  const hasSettled = store.isLoaded('exam') || store.isFailed('exam');
  return {
    exam: isThisExam ? store.exam : null,
    isSettingExam: store.isLoading('exam') || (!isThisExam && !hasSettled),
    error: store.getError('exam') ?? 'It may have been removed, or it is not part of a course you can open.',
  };
};

export const ExamLayout = ({ testPaperId, isPractice, onCloseExam }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { loadAndSetExam, unsetExam, setVisited } = testPaperStore;
  const { setSelectedQuestionId } = useSelectorLookups();
  const { exam, isSettingExam, error } = getExamReadiness(testPaperStore, testPaperId);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const {
    openInstruction,
    closeInstruction,
    examState,
    closeExamSummary,
    openResultPage,
    openExamSummary,
    closeResultPage,
    openExit,
    closeExit,
    toggleTimer,
    handleSubmitTest,
    closeSubmitSummary,
    handleStartExam,
    openSubmitSummary,
  } = useExam();
  const { isResultPage, isOpenInstruction, isOpenExamSummary, isOpenSubmitSummary, isExit, isActiveTimer, isLoading } =
    examState;
  // const isPractice = query.isPractice ? true : false;
  // const testPaperId = query.testPaperId as string;
  // const testPaperResultId = query.testPaperResultId as string;

  const confirmExit = () => {
    unsetExam();
    onCloseExam();
  };

  // The same leaving of the result page as the footer's Back, landed on one question.
  const reviewQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setVisited(questionId);
    closeResultPage();
    if (isPractice) toggleTimer();
  };

  useEffect(() => {
    loadAndSetExam(testPaperId, isPractice);
  }, [testPaperId, isPractice]);

  if (isSettingExam) return <ExamSkeleton isPractice={isPractice} />;

  if (!exam) {
    return (
      <BlankState
        className="py-24"
        label="This test could not be opened"
        description={error}
        action={<Button isSecondary text="Go back" onClick={onCloseExam} />}
      />
    );
  }

  return (
    <>
      <div className="bg-muted relative">
        <div className="fixed top-0 w-full z-10">
          <ExamHeader
            isPractice={isPractice}
            toggleTimer={toggleTimer}
            isActiveTimer={isActiveTimer}
            handleSubmitTest={handleSubmitTest}
            openExit={openExit}
          />
        </div>
        <div className="h-[100vh] overflow-auto pt-14 xl:pt-16">
          <div className="flex h-full w-full justify-between space-x-0 overflow-x-hidden">
            {/* The footer lives in this column, so "Next" sits under the question beside the palette
                rather than under the palette at the far edge of the window. */}
            <div className="flex min-w-0 grow flex-col md:w-[calc(100%-360px)]">
              {/* The column scrolls here, under a footer that stays put — the result page is long. */}
              <div className="min-h-0 flex-1 overflow-auto px-4 md:px-8">
                <Exam
                  isResultPage={isResultPage}
                  openExamSummary={openExamSummary}
                  toggleTimer={toggleTimer}
                  openInstruction={openInstruction}
                  onReviewQuestion={reviewQuestion}
                />
              </div>
              <ExamFooter
                isResultPage={isResultPage}
                isFinishInPalette={isPaletteOpen}
                openResultPage={openResultPage}
                closeResultPage={closeResultPage}
                openSubmitSummary={openSubmitSummary}
                toggleTimer={toggleTimer}
              />
            </div>
            <div className="hidden xl:block">
              <ExamSidebar
                openInstruction={openInstruction}
                closeExamSummary={closeExamSummary}
                isResultPage={isResultPage}
                isOpen={isPaletteOpen}
                onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
                footer={
                  <ExamFinishButton
                    isPrimary
                    isFull
                    openResultPage={openResultPage}
                    openSubmitSummary={openSubmitSummary}
                  />
                }
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={exam?.title}
        isOpen={isOpenExamSummary}
        component={
          <ExamSidebar
            isOpen
            openInstruction={openInstruction}
            closeExamSummary={closeExamSummary}
            isResultPage={isResultPage}
          />
        }
        onClose={closeExamSummary}
      />
      <Modal
        title={isPractice || exam.isSubmitted ? 'Leave this paper?' : 'Leave the test?'}
        isOpen={isExit}
        component={
          <p className="py-4 text-sm text-muted-foreground">
            {isPractice || exam.isSubmitted
              ? 'You can open it again from the course at any time.'
              : 'The test has not been submitted. Your answers so far will be lost.'}
          </p>
        }
        onClose={closeExit}
        footer={
          <ModalFooter
            onSave={confirmExit}
            onCancel={closeExit}
            saveText={isPractice || exam.isSubmitted ? 'Leave' : 'Leave without submitting'}
            cancelText="Stay"
          />
        }
      />
      <Modal
        title="Instructions"
        withoutClose={!isPractice && !isActiveTimer}
        isOpen={isOpenInstruction}
        component={<Instruction />}
        onClose={closeInstruction}
        footer={
          <div className="flex justify-end">
            <Button text={isActiveTimer || exam?.isSubmitted ? 'Close' : 'Start Test'} onClick={handleStartExam} />
          </div>
        }
      />
      <Modal
        title="Summary"
        isOpen={isOpenSubmitSummary}
        component={<TestPaperSummary />}
        onClose={closeSubmitSummary}
        footer={
          <ModalFooter
            onCancel={closeSubmitSummary}
            onSave={handleSubmitTest}
            saveText="Submit"
            cancelText="Cancel"
            isLoading={isLoading}
          />
        }
      />
    </>
  );
};
