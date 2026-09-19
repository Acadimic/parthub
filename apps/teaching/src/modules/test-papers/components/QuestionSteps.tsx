import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import { useSelectorLookups } from '@stores';
import { AddQuestion } from './AddQuestion';
import { AddSolution } from './AddSolution';

const STEPS = [
  { label: 'Question', hint: 'Type, question and options' },
  { label: 'Answer & solution', hint: 'Correct answer, marks, chapter, solution' },
];

/**
 * The two steps of the question drawer, with a header that says where the author is.
 *
 * A completed step is a button back to it; the step ahead is not, because its inputs depend on
 * the current one being valid, and the footer's Next is the one gate that checks that.
 */
export const QuestionSteps = () => {
  const { selectedUpsertQuestionStep, setSelectedUpsertQuestionStep } = useSelectorLookups();

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-3" aria-label="Steps">
        {STEPS.map((step, index) => {
          const isDone = index < selectedUpsertQuestionStep;
          const isActive = index === selectedUpsertQuestionStep;
          const marker = (
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                isActive && 'bg-primary text-primary-foreground',
                isDone && 'bg-success text-success-foreground',
                !isActive && !isDone && 'border border-border bg-background text-muted-foreground',
              )}
            >
              {isDone ? <CheckIcon className="h-3.5 w-3.5" weight="bold" /> : index + 1}
            </span>
          );
          const text = (
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-semibold leading-5',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">{step.hint}</span>
            </span>
          );
          return (
            <li
              key={step.label}
              className="flex min-w-0 flex-1 items-center gap-3"
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone ? (
                <button
                  type="button"
                  onClick={() => setSelectedUpsertQuestionStep(index)}
                  className="flex min-w-0 items-center gap-2.5 rounded-md text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {marker}
                  {text}
                </button>
              ) : (
                <span className="flex min-w-0 items-center gap-2.5">
                  {marker}
                  {text}
                </span>
              )}
              {index < STEPS.length - 1 ? (
                <span className={cn('h-px min-w-6 flex-1', isDone ? 'bg-success' : 'bg-border')} aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
      {selectedUpsertQuestionStep === 0 ? <AddQuestion /> : <AddSolution />}
    </div>
  );
};
