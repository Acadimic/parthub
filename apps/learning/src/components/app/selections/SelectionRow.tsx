import { cn } from '@repo/ui/lib';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { type ReactNode } from 'react';

/** What a marked option turned out to be, keyed by the text colour the caller passes for it. */
const OUTCOME_BY_COLOR: Record<string, SelectionOutcome> = {
  'text-success': 'correct',
  'text-destructive': 'incorrect',
};

export type SelectionOutcome = 'correct' | 'incorrect';

export const getOutcome = (color?: string): SelectionOutcome | undefined =>
  color ? OUTCOME_BY_COLOR[color] : undefined;

interface IProps {
  kind: 'radio' | 'checkbox';
  isSelected: boolean;
  isDisabled: boolean;
  /** Set once the option is marked; colours the whole row by result. */
  outcome?: SelectionOutcome;
  /** The real, visually hidden input — it keeps keyboard and screen-reader behaviour native. */
  input: ReactNode;
  children: ReactNode;
  className?: string;
}

const ROW_TONE = {
  idle: 'border-border bg-background',
  selected: 'border-primary bg-primary/5',
  correct: 'border-success bg-success/10',
  incorrect: 'border-destructive bg-destructive/10',
};

const MARK_TONE = {
  idle: 'border-border bg-background text-transparent',
  selected: 'border-primary bg-primary text-primary-foreground',
  correct: 'border-success bg-success text-success-foreground',
  incorrect: 'border-destructive bg-destructive text-destructive-foreground',
};

/** What sits inside the mark: a cross for a wrong pick, a check for a right one or a checkbox, a dot for a radio. */
const Mark = ({
  kind,
  outcome,
  isVisible,
}: {
  kind: 'radio' | 'checkbox';
  outcome?: SelectionOutcome;
  isVisible: boolean;
}) => {
  if (outcome === 'incorrect') return <XIcon weight="bold" className="h-3 w-3" />;
  if (kind === 'checkbox' || outcome === 'correct') {
    return <CheckIcon weight="bold" className={cn('h-3 w-3', !isVisible && 'invisible')} />;
  }
  return <span className={cn('h-2 w-2 rounded-full bg-current', !isVisible && 'invisible')} />;
};

/**
 * One option of a question: a custom mark (a disc for one-of, a rounded square for any-of) that
 * fills when chosen, and the option's body. The native input stays in the tree but out of sight,
 * so the row is what the learner sees and the input is what the keyboard drives; a focus ring on
 * the row follows the hidden input's focus.
 */
export const SelectionRow = ({ kind, isSelected, isDisabled, outcome, input, children, className }: IProps) => {
  const tone = outcome ?? (isSelected ? 'selected' : 'idle');
  const showsMark = tone !== 'idle';

  return (
    <label
      data-selected={isSelected}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        isDisabled ? 'cursor-default' : 'cursor-pointer hover:border-primary/50 hover:bg-accent/60',
        ROW_TONE[tone],
        className,
      )}
    >
      <span className="sr-only">{input}</span>
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors',
          kind === 'radio' ? 'rounded-full' : 'rounded-md',
          MARK_TONE[tone],
          !isDisabled && tone === 'idle' && 'group-hover:border-primary/60',
        )}
      >
        <Mark kind={kind} outcome={outcome} isVisible={showsMark} />
      </span>
      <span className="min-w-0 flex-1 text-sm text-foreground">{children}</span>
    </label>
  );
};
