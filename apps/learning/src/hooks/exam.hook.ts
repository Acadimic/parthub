import { CollectionType } from '@enums';
import { useCourseStore, useSelectorStore, useTestPaperLookups, useTestPaperStore } from '@stores';
import { useSetState } from 'react-use';

/** Sittings already marked, so re-opening the analytics after an undo does not mark again. */
const markedSittings = new Set<string>();

/** Marks the sitting's test paper done in the course it was opened from, once; none outside a course. */
const completeExamItem = async () => {
  const { exam } = useTestPaperStore.getState();
  const { selectedCourseModuleId } = useSelectorStore.getState();
  if (!exam?.course || !selectedCourseModuleId || markedSittings.has(exam._id)) return;
  markedSittings.add(exam._id);
  await useCourseStore
    .getState()
    .completeCourseModuleItem(
      { course: exam.course, courseModule: selectedCourseModuleId, collectionItem: exam.testPaper },
      CollectionType.TEST_PAPER,
    );
};

/** Submits the sitting and, once the result is saved, marks its test paper done. */
export const submitExamAndComplete = async () => {
  await useTestPaperStore.getState().submitExam();
  if (useTestPaperStore.getState().isFailed('submitResult')) return;
  await completeExamItem();
};

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
    openResultPage();
    closeSubmitSummary();
    submitExamAndComplete();
    setExamState({ isActiveTimer: false });
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

  // A practice sitting is never submitted: opening its analytics is where it ends, so that is what
  // marks it done. An attempt is marked on submit instead (`submitExamAndComplete`).
  const openResultPage = () => {
    setExamState({ isResultPage: true, isActiveTimer: false });
    if (exam?.isPractice) completeExamItem();
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
