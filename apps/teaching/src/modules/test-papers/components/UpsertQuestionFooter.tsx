import { ModalFooter } from '@components/app';
import { QuestionType } from '@enums';
import { TestPaperService } from '@services';
import { useStores } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';

interface IProps {
  onClose: (isForce?: boolean) => void;
  setLoading: (bool: boolean) => void;
  isLoading: boolean;
}

export const UpsertQuestionFooter = observer(({ onClose, setLoading, isLoading }: IProps) => {
  const { selectorStore, questionStore } = useStores();
  const {
    selectedUpsertQuestionStep,
    setSelectedUpsertQuestionStep,
    selectedQuestion,
    selectedTestPaperSection,
    selectedTestPaper,
    selectedSolution,
    removeSelectedSolutionId,
  } = selectorStore;
  const { getOptionsByIds } = questionStore;

  const handleNext = () => {
    if (!selectedTestPaperSection || !selectedQuestion) return;
    if (!selectedQuestion.question?.trim()) {
      errorToast({ message: 'Question is required!' });
      return;
    }
    if (
      selectedQuestion.questionType === QuestionType.SINGLE_CHOICE ||
      selectedQuestion.questionType === QuestionType.MULTIPLE_CHOICE
    ) {
      const options = getOptionsByIds(selectedQuestion.options);
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (!option.option?.trim()) {
          errorToast({ message: `Option ${i + 1} is required!` });
          return;
        }
      }
    }
    setSelectedUpsertQuestionStep(1);
  };

  const handleSaveQuestion = async () => {
    if (!selectedTestPaperSection || !selectedQuestion || !selectedTestPaperSection || !selectedTestPaper) return;
    try {
      const options = getOptionsByIds(selectedQuestion.options);
      const correctCount = options.filter((option) => option.isCorrect).length;
      if (correctCount === 0) {
        errorToast({ message: 'Please add at least one correct option.' });
        return;
      }
      setLoading(true);
      await TestPaperService.upsertTestPaperSectionQuestion({
        testPaper: selectedTestPaper._id,
        question: selectedQuestion,
        options,
        solution: selectedSolution?.isNew && !selectedSolution?.solution ? undefined : selectedSolution,
      });
      successToast({ message: 'Question added successfully!' });
      setTimeout(() => {
        if (selectedQuestion.isNew) {
          selectedQuestion.resetIsNew();
          options.forEach((option) => option.resetIsNew());
        }
        if (selectedSolution?.isNew) {
          selectedSolution.resetIsNew();
        }
        selectedTestPaper.updateTotalQuestionsAndMarks();
        removeSelectedSolutionId();
        onClose();
      }, 500);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (selectedUpsertQuestionStep === 0) {
      handleNext();
    } else if (selectedUpsertQuestionStep === 1) {
      await handleSaveQuestion();
    }
  };

  const onCancel = () => {
    if (selectedUpsertQuestionStep === 1) {
      setSelectedUpsertQuestionStep(0);
    }
  };

  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-full">
        <ModalFooter
          cancelText="Prev"
          saveText={selectedUpsertQuestionStep === 0 ? 'Next' : 'Save'}
          onSave={onSave}
          onCancel={onCancel}
          closeText="Close"
          onClose={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
});
