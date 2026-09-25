import { Button } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { ClipboardTextIcon, ClockIcon, ListNumbersIcon, MedalIcon, PlayIcon, TimerIcon } from '@phosphor-icons/react';
import { type ITestPaper, useTestPaperLookups, useTestPaperStore } from '@stores';
import { getPlural, getStringFormattedDate } from '@utils/helpers';

interface IProps {
  paper: ITestPaper;
  handleOpen: (isPractice?: boolean) => void;
}

const Stat = ({ icon: StatIcon, value, label }: { icon: typeof ClockIcon; value: number; label: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 px-2 py-3">
    <StatIcon weight="bold" className="h-4 w-4 text-muted-foreground" />
    <span className="font-mono text-lg font-semibold leading-none">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

/** The way into a paper: what it holds, and the two ways to sit it. */
export const TestPaperCard = ({ paper, handleOpen }: IProps) => {
  const { getMyAttemptsByTestPaperId } = useTestPaperLookups();
  useLoadOnce(useTestPaperStore, 'results', (state) => state.loadMyResults);
  const attempts = getMyAttemptsByTestPaperId(paper._id);
  const last = attempts[0];

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardTextIcon weight="bold" className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">Test paper</div>
          <h2 className="text-base font-semibold leading-snug">{paper.name}</h2>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat icon={ListNumbersIcon} value={paper.totalQuestions ?? 0} label="Questions" />
        <Stat icon={MedalIcon} value={paper.maxMarks ?? 0} label="Marks" />
        <Stat icon={ClockIcon} value={paper.durationMins ?? 0} label="Minutes" />
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          isSecondary
          isFull
          className="justify-center px-4 py-2.5"
          onClick={() => handleOpen(true)}
          leftsection={<PlayIcon weight="fill" className="h-4 w-4" />}
        >
          Practice
        </Button>
        <Button
          isFull
          className="justify-center px-4 py-2.5"
          onClick={() => handleOpen(false)}
          leftsection={<TimerIcon weight="fill" className="h-4 w-4" />}
        >
          Attempt
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Practice shows each answer as you go. Attempt is timed and scored at the end.
      </p>
      {last ? (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Last attempt{last.createdAt ? ` · ${getStringFormattedDate(last.createdAt)}` : ''}
          </span>
          <span className="font-mono font-semibold">
            {last.marksObtained}/{last.maxMarks}
            <span className="ml-2 font-sans font-normal text-muted-foreground">
              {attempts.length} {getPlural(attempts.length, 'attempt')}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
};
