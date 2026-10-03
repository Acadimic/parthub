import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { ExamFinishButton } from '@components/exam';
import { ArrowCounterClockwiseIcon, CaretLeftIcon, CaretRightIcon, EraserIcon, FlagIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';

interface IProps {
  isResultPage: boolean;
  /** The palette pane is open and shows the finish button, so from `xl` up this bar need not. */
  isFinishInPalette: boolean;
  openResultPage: () => void;
  closeResultPage: () => void;
  openSubmitSummary: () => void;
  toggleTimer: () => void;
}

/**
 * A footer button whose text shows from `sm` up and whose icon stands alone below that, unless it
 * is always labelled.
 */
const FooterButton = ({
  label,
  icon,
  onClick,
  disabled,
  isPrimary,
  isSubtle,
  isPressed,
  trailing,
  isAlwaysLabelled,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
  /** The quiet variant, for the actions on the answer itself rather than the paper. */
  isSubtle?: boolean;
  isPressed?: boolean;
  /** Puts the icon after the label, for "Next". */
  trailing?: boolean;
  /** Previous and Next keep their words on a phone too: they are the footer's main actions. */
  isAlwaysLabelled?: boolean;
  className?: string;
}) => (
  <Button
    isSecondary={!isPrimary && !isSubtle}
    isSubtle={isSubtle}
    aria-label={label}
    aria-pressed={isPressed}
    disabled={disabled}
    className={cn(
      'px-2.5 py-1.5 sm:px-3',
      isSubtle && 'px-2 py-1 text-muted-foreground',
      isPressed && 'bg-accent',
      className,
    )}
    labelClassName={cn(!isAlwaysLabelled && 'hidden sm:block', isSubtle && 'text-xs')}
    onClick={onClick}
    leftsection={trailing ? undefined : icon}
    rightsection={trailing ? icon : undefined}
  >
    {label}
  </Button>
);

/**
 * The bar under the paper. Left: back. Middle: what can be done to the answer on screen, quietly.
 * Right: forward, then the way out of the paper — the same places in every mode, so nothing jumps.
 * Below `xl` the palette is a sheet that carries the way out, so here it takes Next's place only on
 * the last question, where Next has nowhere to go.
 */
export const ExamFooter = ({
  isResultPage,
  isFinishInPalette,
  openResultPage,
  closeResultPage,
  openSubmitSummary,
  toggleTimer,
}: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;

  if (!exam) return null;
  const { isPractice, isSubmitted } = exam;
  const {
    clearResponse,
    isFirstQuestion,
    isLastQuestion,
    isSelectedQuestionMarkedForReview,
    isSelectedQuestionResponded,
    resetResponse,
    selectNextQuestion,
    selectPrevQuestion,
    toggleSelectedQuestionMarkForReview,
  } = testPaperStore;

  // Back to the question the learner was on. Leaving the paper stays with the header's close.
  const handleBackClick = () => {
    closeResultPage();
    if (exam.isPractice) toggleTimer();
  };

  if (isResultPage) {
    return (
      <div className="h-14 shrink-0 border-t border-border bg-background xl:h-16">
        <div className="flex h-full items-center justify-center px-3 md:px-6">
          <Button onClick={handleBackClick} leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const isMarked = isSelectedQuestionMarkedForReview();
  const isLast = isLastQuestion();

  return (
    <div className="h-14 shrink-0 border-t border-border bg-background xl:h-16">
      <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
        <FooterButton
          label="Previous"
          icon={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          isAlwaysLabelled
          disabled={isFirstQuestion()}
          onClick={selectPrevQuestion}
        />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {isPractice || isSubmitted ? null : (
            <FooterButton
              label={isMarked ? 'Marked for review' : 'Mark for review'}
              // Once marked, the flag fills in the palette's "marked" yellow, so the state reads at a
              // glance and survives the icon-only layout below `sm`.
              icon={
                <FlagIcon
                  weight={isMarked ? 'fill' : 'bold'}
                  className={cn('h-3.5 w-3.5', isMarked && 'text-warning')}
                />
              }
              isSubtle
              isPressed={isMarked}
              onClick={toggleSelectedQuestionMarkForReview}
            />
          )}
          {isSubmitted ? null : (
            <FooterButton
              label={isPractice ? 'Reset' : 'Clear'}
              icon={
                isPractice ? (
                  <ArrowCounterClockwiseIcon weight="bold" className="h-3.5 w-3.5" />
                ) : (
                  <EraserIcon weight="bold" className="h-3.5 w-3.5" />
                )
              }
              isSubtle
              disabled={!isSelectedQuestionResponded()}
              onClick={isPractice ? resetResponse : clearResponse}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FooterButton
            label="Next"
            icon={<CaretRightIcon weight="bold" className="h-4 w-4" />}
            isPrimary={!isLast}
            trailing
            isAlwaysLabelled
            disabled={isLast}
            className={cn(isLast && 'hidden xl:inline-block')}
            onClick={selectNextQuestion}
          />
          {/* Outlined while there are questions ahead, filled on the last one, where it is the next step.
              Below `xl` it lives in the palette sheet until the last question. */}
          <ExamFinishButton
            isPrimary={isLast}
            className={cn(!isLast && 'hidden xl:inline-block', isFinishInPalette && 'xl:hidden')}
            openResultPage={openResultPage}
            openSubmitSummary={openSubmitSummary}
          />
        </div>
      </div>
    </div>
  );
};
