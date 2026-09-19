import { RichTextView } from '@repo/ui/content';
import { type OptionDto } from '@repo/shared/contracts';
import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import { optionLetter } from './question-types';

interface IProps {
  options: OptionDto[];
  /** More than one option may be marked correct. */
  isMultiple: boolean;
  /**
   * Marks or unmarks an option. Absent, the list is read-only and shows which options are
   * correct — the paper view — rather than asking.
   */
  onToggle?: (optionId: string) => void;
  className?: string;
}

/** The container role that matches the rows' role, so a screen reader announces "1 of 4". */
const EDITABLE_LIST_ROLE = { checkbox: 'group', radio: 'radiogroup' } as const;

/**
 * The options of a choice question as lettered rows, in both the drawer and the paper.
 *
 * One component for asking and for showing: the author picks the correct answer on the same rows
 * a reader later sees ticked, so the two never disagree about what an option looks like. The
 * letter is the handle — "option B" is how a teacher talks about it — and the tick is drawn, not
 * left to a native radio, so an equation-heavy option lines up with the rest.
 */
export const AnswerChoices = ({ options, isMultiple, onToggle, className }: IProps) => {
  const isEditable = Boolean(onToggle);
  const role = isMultiple ? 'checkbox' : 'radio';
  const listRole = isEditable ? EDITABLE_LIST_ROLE[role] : 'list';

  return (
    <div className={cn('flex flex-col gap-1.5', className)} role={listRole}>
      {options.map((option, index) => {
        const isCorrect = Boolean(option.isCorrect);
        // Read-only rows say it in words as well as with the tick, for anyone who cannot see the colour.
        const correctLabel = isCorrect ? (
          <span className="shrink-0 text-xs font-semibold text-success">Correct</span>
        ) : null;
        const content = (
          <>
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                isCorrect ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {isCorrect && !isEditable ? <CheckIcon className="h-3.5 w-3.5" weight="bold" /> : optionLetter(index)}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <RichTextView
                value={option.body}
                fallback={<span className="text-muted-foreground">Empty option</span>}
              />
            </span>
            {isEditable ? (
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors',
                  isMultiple ? 'rounded' : 'rounded-full',
                  isCorrect ? 'border-success bg-success text-success-foreground' : 'border-border bg-background',
                )}
                aria-hidden="true"
              >
                {isCorrect ? <CheckIcon className="h-3 w-3" weight="bold" /> : null}
              </span>
            ) : (
              correctLabel
            )}
          </>
        );
        const rowClass = cn(
          'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left',
          isCorrect ? 'border-success/50 bg-success/5' : 'border-border bg-background',
        );
        if (!isEditable) {
          return (
            <div key={option._id} role="listitem" className={rowClass}>
              {content}
            </div>
          );
        }
        return (
          <button
            key={option._id}
            type="button"
            role={role}
            aria-checked={isCorrect}
            onClick={() => onToggle?.(option._id)}
            className={cn(
              rowClass,
              'transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};
