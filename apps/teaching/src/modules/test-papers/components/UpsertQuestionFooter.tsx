import { type QuestionDto } from '@repo/shared/contracts';
import { isRichTextEmpty } from '@repo/shared/utils';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@phosphor-icons/react';
import { Button } from '@repo/ui/app';
import { QuestionType } from '@enums';
import { QuestionService } from '@services';
import { useQuestionLookups, useSelectedQuestion, useSelectorLookups, useTestPaperStore } from '@stores';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { getQuestionTypeMeta, optionLetter } from './question-types';

interface IProps {
  onClose: (isForce?: boolean) => void;
  setLoading: (bool: boolean) => void;
  isLoading: boolean;
}

const STEP_COUNT = 2;

/** Returns the first problem with the question, or `null` when it is ready for the next step. */
const findContentProblem = (question: QuestionDto): string | null => {
  if (isRichTextEmpty(question.body)) return 'Write the question first.';
  const meta = getQuestionTypeMeta(question.questionType);
  // True/false options are seeded by the store, so there is nothing to check for that type.
  if (!meta.hasChoices || question.questionType === QuestionType.BOOLEAN) return null;
  const blankIndex = (question.options ?? []).findIndex((option) => isRichTextEmpty(option.body));
  return blankIndex === -1 ? null : `Option ${optionLetter(blankIndex)} is empty.`;
};

/** The footer of the question drawer: Close on the left, the step's actions on the right. */
export const UpsertQuestionFooter = ({ onClose, setLoading, isLoading }: IProps) => {
  const { patchQuestion } = useQuestionLookups();
  const { selectedUpsertQuestionStep, setSelectedUpsertQuestionStep, selectedTestPaperId } = useSelectorLookups();
  const selectedQuestion = useSelectedQuestion();
  const reloadTestPaper = useTestPaperStore((state) => state.reloadTestPaper);
  const isFirstStep = selectedUpsertQuestionStep === 0;

  const handleNext = () => {
    if (!selectedQuestion) return;
    const problem = findContentProblem(selectedQuestion);
    if (problem) {
      errorToast({ message: problem });
      return;
    }
    setSelectedUpsertQuestionStep(1);
  };

  const handleSave = async () => {
    if (!selectedQuestion) return;
    if (!(selectedQuestion.options ?? []).some((option) => option.isCorrect)) {
      errorToast({ message: 'Mark the correct answer first.' });
      return;
    }
    setLoading(true);
    try {
      // Options and the solution travel inside the question, so this is the whole save. The
      // server recomputes the paper's totals from the section — the client cannot, because a
      // section may belong to papers it has never loaded.
      await QuestionService.upsertQuestion(selectedQuestion);
      patchQuestion(selectedQuestion._id, { isNew: false });
      successToast({ message: 'Question saved.' });
      // Forced: the drawer's own close is refused while a save is in flight, and this one still is.
      onClose(true);
      // Last: a failed refresh is not a failed save.
      await reloadTestPaper(selectedTestPaperId);
    } catch (error) {
      reportError(error, 'Could not save the question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button isSubtle text="Close" onClick={() => onClose()} disabled={isLoading} />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Step {selectedUpsertQuestionStep + 1} of {STEP_COUNT}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        {!isFirstStep ? (
          <Button
            isSecondary
            text="Back"
            leftsection={<ArrowLeftIcon className="h-4 w-4" weight="bold" />}
            onClick={() => setSelectedUpsertQuestionStep(0)}
            disabled={isLoading}
          />
        ) : null}
        {isFirstStep ? (
          <Button
            text="Next"
            rightsection={<ArrowRightIcon className="h-4 w-4" weight="bold" />}
            onClick={handleNext}
          />
        ) : (
          <Button
            text={selectedQuestion?.isNew ? 'Save question' : 'Save changes'}
            leftsection={<CheckIcon className="h-4 w-4" weight="bold" />}
            onClick={handleSave}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
