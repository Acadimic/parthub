import { type QuestionDto } from '@repo/shared/contracts';
import { isRichTextEmpty } from '@repo/shared/utils';
import { ModalFooter } from '@repo/ui/app';
import { QuestionType } from '@enums';
import { QuestionService } from '@services';
import {
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useTestPaperStore,
} from '@stores';
import { errorToast, reportError, successToast } from '@utils/helpers';

interface IProps {
  onClose: (isForce?: boolean) => void;
  setLoading: (bool: boolean) => void;
  isLoading: boolean;
}

/**
 * Question types whose option text the author writes, and so must be checked.
 *
 * True/false is deliberately absent: its two options are seeded with "True" and "False" by the
 * store, so there is nothing for the author to fill in and nothing here to reject.
 */
const CHOICE_TYPES: QuestionType[] = [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE];

/** Returns the first problem with the question, or `null` when it is ready for the next step. */
const findContentProblem = (question: QuestionDto): string | null => {
  if (isRichTextEmpty(question.body)) return 'Question is required!';
  if (!CHOICE_TYPES.includes(question.questionType as QuestionType)) return null;
  const blankIndex = (question.options ?? []).findIndex((option) => isRichTextEmpty(option.body));
  return blankIndex === -1 ? null : `Option ${blankIndex + 1} is required!`;
};

export const UpsertQuestionFooter = ({ onClose, setLoading, isLoading }: IProps) => {
  const { patchQuestion } = useQuestionLookups();
  const { selectedUpsertQuestionStep, setSelectedUpsertQuestionStep, selectedTestPaperId } = useSelectorLookups();
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedQuestion = useSelectedQuestion();
  const reloadTestPaper = useTestPaperStore((state) => state.reloadTestPaper);
  const isFirstStep = selectedUpsertQuestionStep === 0;

  const handleNext = () => {
    if (!selectedTestPaperSection || !selectedQuestion) return;
    const problem = findContentProblem(selectedQuestion);
    if (problem) {
      errorToast({ message: problem });
      return;
    }
    setSelectedUpsertQuestionStep(1);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return;
    if (!(selectedQuestion.options ?? []).some((option) => option.isCorrect)) {
      errorToast({ message: 'Please add at least one correct option.' });
      return;
    }
    setLoading(true);
    try {
      // Options and the solution travel inside the question, so this is the whole save. The
      // server recomputes the paper's totals from the section — the client cannot, because a
      // section may belong to papers it has never loaded.
      await QuestionService.upsertQuestion(selectedQuestion);
      patchQuestion(selectedQuestion._id, { isNew: false });
      successToast({ message: 'Question saved successfully!' });
      onClose();
      // Last, and after the save has been reported: the paper is re-read because its question count
      // and max marks were just recomputed server-side and nothing else here would learn the new
      // values — but a failure to refresh is not a failure to save, and must not read as one.
      await reloadTestPaper(selectedTestPaperId);
    } catch (error) {
      // Previously an empty `catch {}`, which swallowed the failure whole.
      reportError(error, 'Could not save the question.');
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (isFirstStep) handleNext();
    else await handleSaveQuestion();
  };

  const onCancel = () => {
    if (!isFirstStep) setSelectedUpsertQuestionStep(0);
  };

  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full">
        <ModalFooter
          cancelText="Prev"
          saveText={isFirstStep ? 'Next' : 'Save'}
          onSave={onSave}
          onCancel={onCancel}
          // There is no previous step to go back to from the first one, and the button did nothing
          // there. Close stays on the left throughout.
          hideCancel={isFirstStep}
          closeText="Close"
          onClose={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
