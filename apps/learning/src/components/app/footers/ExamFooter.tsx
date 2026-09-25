import { Button } from '@repo/ui/app';
import { ArrowCounterClockwiseIcon, CaretLeftIcon, CaretRightIcon, EraserIcon, FlagIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';

interface IProps {
  isResultPage: boolean;
  openResultPage: () => void;
  closeResultPage: () => void;
  openExit: () => void;
  openSubmitSummary: () => void;
  toggleTimer: () => void;
}

/** A footer button whose text shows from `sm` up and whose icon stands alone below that. */
const FooterButton = ({
  label,
  icon,
  onClick,
  disabled,
  isPrimary,
  isPressed,
  trailing,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
  isPressed?: boolean;
  /** Puts the icon after the label, for "Next". */
  trailing?: boolean;
}) => (
  <Button
    isSecondary={!isPrimary}
    aria-label={label}
    aria-pressed={isPressed}
    disabled={disabled}
    className="px-2.5 py-1.5 sm:px-3"
    labelClassName="hidden sm:block"
    onClick={onClick}
    leftsection={trailing ? undefined : icon}
    rightsection={trailing ? icon : undefined}
  >
    {label}
  </Button>
);

/**
 * The bar under the paper. Left: back. Middle: what can be done to the question on screen. Right:
 * the way out of the paper, then forward — the same places in every mode, so nothing jumps.
 */
export const ExamFooter = ({
  isResultPage,
  openResultPage,
  closeResultPage,
  openExit,
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

  const handleViewSolutionsClick = () => {
    closeResultPage();
    if (exam.isPractice) toggleTimer();
  };

  if (isResultPage) {
    return (
      <div className="h-14 border-t border-border bg-background xl:h-16">
        <div className="flex h-full items-center justify-between px-3 md:px-6">
          <Button isSecondary text="Exit" onClick={openExit} />
          <Button text="View solutions" onClick={handleViewSolutionsClick} />
        </div>
      </div>
    );
  }

  const isMarked = isSelectedQuestionMarkedForReview();
  const isLast = isLastQuestion();

  // What the finishing button does depends on where the sitting is. It is outlined while there
  // are questions ahead and filled on the last one, where it becomes the natural next step.
  const getFinishAction = () => {
    if (isSubmitted) return { label: 'View result', onClick: openResultPage };
    if (isPractice) return { label: 'View analytics', onClick: openResultPage };
    return { label: 'Submit', onClick: openSubmitSummary };
  };
  const finish = getFinishAction();

  return (
    <div className="h-14 border-t border-border bg-background xl:h-16">
      <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
        <FooterButton
          label="Previous"
          icon={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          disabled={isFirstQuestion()}
          onClick={selectPrevQuestion}
        />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {isPractice || isSubmitted ? null : (
            <FooterButton
              label={isMarked ? 'Marked for review' : 'Mark for review'}
              icon={<FlagIcon weight={isMarked ? 'fill' : 'bold'} className="h-4 w-4" />}
              isPressed={isMarked}
              onClick={toggleSelectedQuestionMarkForReview}
            />
          )}
          {isSubmitted ? null : (
            <FooterButton
              label={isPractice ? 'Reset answer' : 'Clear answer'}
              icon={
                isPractice ? (
                  <ArrowCounterClockwiseIcon weight="bold" className="h-4 w-4" />
                ) : (
                  <EraserIcon weight="bold" className="h-4 w-4" />
                )
              }
              disabled={!isSelectedQuestionResponded()}
              onClick={isPractice ? resetResponse : clearResponse}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button isSecondary={!isLast} className="px-3 py-1.5" onClick={finish.onClick}>
            {finish.label}
          </Button>
          <FooterButton
            label="Next"
            icon={<CaretRightIcon weight="bold" className="h-4 w-4" />}
            isPrimary={!isLast}
            trailing
            disabled={isLast}
            onClick={selectNextQuestion}
          />
        </div>
      </div>
    </div>
  );
};
