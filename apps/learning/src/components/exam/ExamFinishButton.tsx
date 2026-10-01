import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useTestPaperLookups } from '@stores';

interface IProps {
  openResultPage: () => void;
  openSubmitSummary: () => void;
  isPrimary?: boolean;
  isFull?: boolean;
  className?: string;
}

/**
 * The way out of the sitting: submit a test, or open the result of one already marked. Shown in
 * the palette's footer where the palette is a pane, and in the question footer everywhere else.
 */
export const ExamFinishButton = ({ openResultPage, openSubmitSummary, isPrimary, isFull, className }: IProps) => {
  const { exam } = useTestPaperLookups();
  if (!exam) return null;

  const getAction = () => {
    if (exam.isSubmitted) return { label: 'View result', onClick: openResultPage };
    if (exam.isPractice) return { label: 'View analytics', onClick: openResultPage };
    return { label: 'Submit', onClick: openSubmitSummary };
  };
  const action = getAction();

  return (
    <Button
      isSecondary={!isPrimary}
      isFull={isFull}
      className={cn('px-3 py-1.5', isFull && 'justify-center', className)}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );
};
