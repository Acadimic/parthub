import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

interface IStepNavProps {
  index: number;
  count: number;
  onChange: (index: number) => void;
  /** Read aloud for the arrows: "step", "sentence". */
  noun: string;
}

const ARROW =
  'flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30';

/**
 * A quiet carousel row — back, the dots, next — for moving through a block's steps. Deliberately
 * smaller than the reader's own Next, which moves through the lesson. A dot jumps straight to its
 * step.
 */
export const StepNav = ({ index, count, onChange, noun }: IStepNavProps) => (
  <div className="flex items-center justify-center gap-3 print:hidden">
    <button
      type="button"
      onClick={() => onChange(index - 1)}
      disabled={index === 0}
      aria-label={`Previous ${noun}`}
      className={cn(ARROW, 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground')}
    >
      <CaretLeftIcon className="h-4 w-4" weight="bold" />
    </button>
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, dot) => (
        <button
          key={dot}
          type="button"
          onClick={() => onChange(dot)}
          aria-label={`${noun} ${dot + 1} of ${count}`}
          aria-current={dot === index ? 'step' : undefined}
          className={cn(
            'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dot === index ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/50',
          )}
        />
      ))}
    </div>
    <button
      type="button"
      onClick={() => onChange(index + 1)}
      disabled={index === count - 1}
      aria-label={`Next ${noun}`}
      className={cn(ARROW, 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20')}
    >
      <CaretRightIcon className="h-4 w-4" weight="bold" />
    </button>
  </div>
);
