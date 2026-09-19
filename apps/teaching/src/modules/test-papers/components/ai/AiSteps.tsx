import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';

export interface IAiStep<K extends string> {
  key: K;
  label: string;
  hint: string;
}

interface IProps<K extends string> {
  steps: IAiStep<K>[];
  current: K;
  /** A completed step is a button back to it; the steps ahead are not. */
  onSelect: (key: K) => void;
}

/** The three-step header the AI drawers share. */
export const AiSteps = <K extends string>({ steps, current, onSelect }: IProps<K>) => {
  const currentIndex = steps.findIndex((step) => step.key === current);
  return (
    <ol className="flex items-center gap-3" aria-label="Steps">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <li
            key={step.key}
            className="flex min-w-0 flex-1 items-center gap-3"
            aria-current={isActive ? 'step' : undefined}
          >
            <button
              type="button"
              disabled={!isDone}
              onClick={() => onSelect(step.key)}
              className="flex min-w-0 items-center gap-2.5 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-primary text-primary-foreground',
                  isDone && 'bg-success text-success-foreground',
                  !isActive && !isDone && 'border border-border text-muted-foreground',
                )}
              >
                {isDone ? <CheckIcon weight="bold" className="h-3.5 w-3.5" /> : index + 1}
              </span>
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
            </button>
            {index < steps.length - 1 ? (
              <span className={cn('h-px min-w-6 flex-1', isDone ? 'bg-success' : 'bg-border')} aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};
