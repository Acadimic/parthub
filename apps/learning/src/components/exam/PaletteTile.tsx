import { cn } from '@repo/ui/lib';

/**
 * A question's state on the palette. The first five are the states of a sitting in progress; the
 * last four are what a question turns out to be once it is marked, in practice or after submitting.
 */
export type PaletteStatus =
  | 'answered'
  | 'notAnswered'
  | 'notVisited'
  | 'marked'
  | 'answeredMarked'
  | 'correct'
  | 'incorrect'
  | 'partial'
  | 'unattempted';

const TONE: Record<PaletteStatus, string> = {
  answered: 'bg-success text-success-foreground',
  correct: 'bg-success text-success-foreground',
  notAnswered: 'bg-destructive text-destructive-foreground',
  incorrect: 'bg-destructive text-destructive-foreground',
  notVisited: 'border border-border bg-muted text-muted-foreground',
  unattempted: 'border border-border bg-muted text-muted-foreground',
  marked: 'bg-warning text-warning-foreground',
  partial: 'bg-warning text-warning-foreground',
  answeredMarked: 'bg-warning text-warning-foreground',
};

export const PALETTE_LABELS: Record<PaletteStatus, string> = {
  answered: 'Answered',
  notAnswered: 'Not answered',
  notVisited: 'Not visited',
  marked: 'Marked for review',
  answeredMarked: 'Answered & marked',
  correct: 'Correct',
  incorrect: 'Incorrect',
  partial: 'Partially correct',
  unattempted: 'Unattempted',
};

interface IProps {
  status: PaletteStatus;
  /** The question number, or a count in the legend. */
  value: number;
  size?: 'sm' | 'lg';
  /** The question on screen: ringed so it can be found in the grid. */
  isCurrent?: boolean;
  className?: string;
}

/** One square of the question palette. "Answered & marked" carries a dot, as the convention has it. */
export const PaletteTile = ({ status, value, size = 'lg', isCurrent, className }: IProps) => (
  <span
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold',
      size === 'lg' ? 'h-9 w-9 text-sm' : 'h-6 w-6 text-xs',
      TONE[status],
      isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      className,
    )}
  >
    {value}
    {status === 'answeredMarked' ? (
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
    ) : null}
  </span>
);
