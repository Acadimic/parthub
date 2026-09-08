import { Button, FullScreenLoader, Modal, ModalFooter } from '@parthhub/ui/app';
import { ExamFooter } from '@components/app/footers';
import { ExamHeader } from '@components/app/headers';
import { ExamSidebar, Instruction } from '@components/exam';
import { BlankState } from '@components/others';
import { useExam } from '@hooks/exam.hook';
import { TestPaperSummary } from '@modules/test-papers/components/TestPaperSummary';
import { Exam } from '@modules/test-papers/Exam';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  testPaperId: string;
  isPractice: boolean;
  onCloseExam: () => void;
}

export const ExamLayout = observer(({ testPaperId, isPractice, onCloseExam }: IProps) => {
  const { testPaperStore } = useStores();
  const { exam, isSettingExam, loadAndSetExam, unsetExam } = testPaperStore;
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

  useEffect(() => {
    loadAndSetExam(testPaperId, isPractice);
  }, [testPaperId, isPractice]);

  if (isSettingExam) return <FullScreenLoader loading={isSettingExam} />;

  if (!exam) return <BlankState label="No Exam Found." />;

  return (
    <>
      <div className="bg-background-secondary relative">
        <div className="fixed top-0 w-full z-10">
          <ExamHeader
            isPractice={isPractice}
            toggleTimer={toggleTimer}
            isActiveTimer={isActiveTimer}
            handleSubmitTest={handleSubmitTest}
          />
        </div>
        <div className="overflow-auto h-[100vh] py-14 xl:py-16">
          <div className="flex justify-between space-x-0 w-full h-full overflow-x-hidden">
            <div className="grow px-4 md:px-8 md:w-[calc(100%-360px)]">
              <Exam
                isResultPage={isResultPage}
                openExamSummary={openExamSummary}
                toggleTimer={toggleTimer}
                openInstruction={openInstruction}
              />
            </div>
            <div className="hidden xl:block">
              <ExamSidebar
                openInstruction={openInstruction}
                closeExamSummary={closeExamSummary}
                openSubmitSummary={openSubmitSummary}
                openResultPage={openResultPage}
                isResultPage={isResultPage}
              />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 w-full">
          <ExamFooter
            isResultPage={isResultPage}
            openResultPage={openResultPage}
            closeResultPage={closeResultPage}
            openExit={openExit}
            openSubmitSummary={openSubmitSummary}
            toggleTimer={toggleTimer}
          />
        </div>
      </div>

      <Modal
        title={exam?.title}
        isOpen={isOpenExamSummary}
        component={
          <ExamSidebar
            openInstruction={openInstruction}
            closeExamSummary={closeExamSummary}
            openSubmitSummary={openSubmitSummary}
            openResultPage={openResultPage}
            isResultPage={isResultPage}
          />
        }
        onClose={closeExamSummary}
      />
      <Modal
        title="Confirm Exit"
        isOpen={isExit}
        component={<div className="font-medium py-8">Are you sure want to exit?</div>}
        onClose={closeExit}
        footer={<ModalFooter onSave={confirmExit} onCancel={closeExit} saveText="Yes" cancelText="No" />}
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
});
