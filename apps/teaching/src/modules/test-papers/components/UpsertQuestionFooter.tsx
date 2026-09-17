import { type QuestionDto } from '@repo/shared/contracts';
import { isRichTextEmpty } from '@repo/shared/utils';
import { ModalFooter } from '@repo/ui/app';
import { QuestionType } from '@enums';
import { QuestionService } from '@services';
import { useQuestionLookups, useSelectedQuestion, useSelectedTestPaperSection, useSelectorLookups } from '@stores';
import { errorToast, successToast } from '@utils/helpers';

interface IProps {
  onClose: (isForce?: boolean) => void;
  setLoading: (bool: boolean) => void;
  isLoading: boolean;
}

/** Question types whose answers are picked from a list, and so must have option text. */
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
  const { selectedUpsertQuestionStep, setSelectedUpsertQuestionStep } = useSelectorLookups();
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedQuestion = useSelectedQuestion();

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
    } catch (error) {
      // Previously an empty `catch {}`, which swallowed the failure whole: no toast, no message,
      // and a modal that simply sat there.
      errorToast({ message: error instanceof Error ? error.message : 'Could not save the question.' });
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (selectedUpsertQuestionStep === 0) handleNext();
    else await handleSaveQuestion();
  };

  const onCancel = () => {
    if (selectedUpsertQuestionStep === 1) setSelectedUpsertQuestionStep(0);
  };

  return (
    <div className="flex w-full items-center justify-center">
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
