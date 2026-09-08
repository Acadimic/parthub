import { ModalFooter } from '@repo/ui/app';
import { QuestionType } from '@enums';
import { TestPaperService } from '@services';
import {
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedSolution,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { errorToast, successToast } from '@utils/helpers';

interface IProps {
  onClose: (isForce?: boolean) => void;
  setLoading: (bool: boolean) => void;
  isLoading: boolean;
}

export const UpsertQuestionFooter = ({ onClose, setLoading, isLoading }: IProps) => {
  const selectorStore = useSelectorLookups();
  const testPaperStore = useTestPaperLookups();
  const { updateTotalQuestionsAndMarks } = testPaperStore;
  const questionStore = useQuestionLookups();
  const { patchSolution } = questionStore;
  const { patchQuestion } = questionStore;
  const { patchOption } = questionStore;
  const { selectedUpsertQuestionStep, setSelectedUpsertQuestionStep, removeSelectedSolutionId } = selectorStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  const selectedSolution = useSelectedSolution();
  const selectedQuestion = useSelectedQuestion();
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
      const options = getOptionsByIds(selectedQuestion.options ?? []);
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
      const options = getOptionsByIds(selectedQuestion.options ?? []);
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
          patchQuestion(selectedQuestion._id, { isNew: false });
          options.forEach((option) => patchOption(option._id, { isNew: false }));
        }
        if (selectedSolution?.isNew) {
          patchSolution(selectedSolution._id, { isNew: false });
        }
        updateTotalQuestionsAndMarks(selectedTestPaper._id);
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
};
