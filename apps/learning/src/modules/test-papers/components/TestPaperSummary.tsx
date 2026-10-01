import { cn } from '@repo/ui/lib';
import { CheckCircleIcon, FlagIcon, type Icon, MinusCircleIcon, TimerIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';
import { getTimeString } from '@utils/helpers';

interface IRow {
  label: string;
  value: string | number;
  icon: Icon;
  /** Draws attention to a count the learner may want to act on before handing in. */
  isWarning?: boolean;
}

/** The state of the sitting, shown once more before it is handed in. */
export const TestPaperSummary = () => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;

  if (!exam) return <></>;

  const { numberOfQuestions, markedForReviews } = exam;
  const { getAttemptedCount, getTimeLeft } = testPaperStore;
  const unattempted = numberOfQuestions - getAttemptedCount();

  const rows: IRow[] = [
    { icon: TimerIcon, label: 'Time left', value: getTimeString(getTimeLeft()) },
    { icon: CheckCircleIcon, label: 'Attempted', value: getAttemptedCount() },
    { icon: MinusCircleIcon, label: 'Unattempted', value: unattempted, isWarning: unattempted > 0 },
    {
      icon: FlagIcon,
      label: 'Marked for review',
      value: markedForReviews.length,
      isWarning: markedForReviews.length > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <row.icon weight="bold" className="h-4 w-4 text-muted-foreground" />
              {row.label}
            </div>
            <div className={cn('font-mono text-sm font-semibold', row.isWarning && 'rounded-md bg-warning/20 px-1.5')}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm">
        Submit the test now?{' '}
        <span className="text-muted-foreground">You will not be able to change your answers afterwards.</span>
      </p>
    </div>
  );
};
