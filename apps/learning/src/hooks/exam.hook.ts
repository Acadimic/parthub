import { useTestPaperLookups } from '@stores';
import { useSetState } from 'react-use';

interface IExamState {
  isOpenInstruction: boolean;
  isOpenSubmitSummary: boolean;
  isActiveTimer: boolean;
  isResultPage: boolean;
  isExit: boolean;
  isOpenExamSummary: boolean;
  isLoading: boolean;
}

export const useExam = () => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;
  const [examState, setExamState] = useSetState<IExamState>({
    isOpenInstruction: false,
    isOpenSubmitSummary: false,
    isActiveTimer: false,
    isResultPage: false,
    isExit: false,
    isOpenExamSummary: false,
    isLoading: false,
  });

  const handleSubmitTest = () => {
    if (!exam) return;
    const { getAccuracy, getMarksObtained, getPercentage } = testPaperStore;
    openResultPage();
    closeSubmitSummary();
    testPaperStore.submitExam();
    setExamState({ isActiveTimer: false });
    // The result payload is the sitting plus the three figures the store derives from it.
    const data = {
      ...exam,
      accuracy: getAccuracy(),
      percentage: getPercentage(),
      marksObtained: getMarksObtained(),
    };
  };

  const closeInstruction = () => {
    setExamState({ isOpenInstruction: false });
  };

  const openInstruction = () => {
    setExamState({ isOpenInstruction: true });
  };

  const handleStartExam = () => {
    if (!examState.isActiveTimer) toggleTimer();
    closeInstruction();
  };

  const toggleTimer = () => {
    setExamState({ isActiveTimer: !examState.isActiveTimer, isOpenInstruction: examState.isActiveTimer });
  };

  const openExit = () => {
    setExamState({ isExit: true });
  };

  const closeExit = () => {
    setExamState({ isExit: false });
  };

  const confirmExit = () => {
    closeExit();
  };

  const closeResultPage = () => {
    setExamState({ isResultPage: false });
  };

  const openResultPage = () => {
    setExamState({ isResultPage: true, isActiveTimer: false });
  };

  const openExamSummary = () => {
    setExamState({ isOpenExamSummary: true });
  };

  const closeExamSummary = () => {
    setExamState({ isOpenExamSummary: false });
  };

  const openSubmitSummary = () => {
    setExamState({ isOpenSubmitSummary: true });
  };

  const closeSubmitSummary = () => {
    setExamState({ isOpenSubmitSummary: false });
  };

  return {
    examState,
    closeInstruction,
    openInstruction,
    toggleTimer,
    openExit,
    closeExit,
    confirmExit,
    openResultPage,
    closeResultPage,
    openExamSummary,
    closeExamSummary,
    openSubmitSummary,
    closeSubmitSummary,
    handleSubmitTest,
    handleStartExam,
  };
};
