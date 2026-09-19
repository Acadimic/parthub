import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { type QuestionType } from '@enums';
import { useQuestionLookups, useSelectedQuestion, useSelectedTestPaperSection, useSelectorLookups } from '@stores';
import { getQuestionTypeMeta, QUESTION_TYPE_ORDER, QUESTION_TYPES } from './question-types';

/**
 * The question type, as a row of choices rather than a dropdown.
 *
 * Six types is few enough to see at once, and seeing them is how an author who has never used
 * the tool learns what it can ask. A saved question keeps its type: options and marks were written
 * against it, and a change would silently invalidate both, so it shows as a badge instead.
 */
export const QuestionTypePicker = () => {
  const { setQuestionType, patchQuestion } = useQuestionLookups();
  const { setSelectedQuestionType, setSelectedUpsertQuestionStep } = useSelectorLookups();
  const selectedQuestion = useSelectedQuestion();
  const selectedSection = useSelectedTestPaperSection();

  if (!selectedQuestion) return null;

  const current = getQuestionTypeMeta(selectedQuestion.questionType);

  if (!selectedQuestion.isNew) {
    const Icon = current.icon;
    return (
      <Badge tone="neutral" appearance="soft" className="gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {current.label}
      </Badge>
    );
  }

  const choose = (type: QuestionType) => {
    setQuestionType(selectedQuestion._id, type);
    // The marks belong to the type, not to the question: switching from a 4/-1 single choice to an
    // integer used to keep the -1, because only the options were rebuilt.
    const typeMarkings = selectedSection?.defaultMarkings[type];
    if (typeMarkings) patchQuestion(selectedQuestion._id, { markings: { ...typeMarkings } });
    setSelectedQuestionType(type);
    setSelectedUpsertQuestionStep(0);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Question type">
      {QUESTION_TYPE_ORDER.map((type) => {
        const meta = QUESTION_TYPES[type];
        const Icon = meta.icon;
        const isActive = type === selectedQuestion.questionType;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => choose(type)}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border hover:border-primary/40 hover:bg-accent/50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" weight={isActive ? 'fill' : 'regular'} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5">{meta.label}</span>
              <span className="block text-xs leading-4 text-muted-foreground">{meta.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
