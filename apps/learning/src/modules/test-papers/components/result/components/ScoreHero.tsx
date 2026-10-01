import { Button, CircularProgress, Spinner, StatTile } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CrosshairIcon,
  GaugeIcon,
  ListChecksIcon,
  TimerIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useTestPaperStore } from '@stores';
import { formatSeconds, getVerdict } from '../analytics';
import { type IResultAnalytics } from '../useResultAnalytics';

const VERDICT_RING: Record<ReturnType<typeof getVerdict>['tone'], string> = {
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

/** Whether the submitted sitting reached the server, with a way to try again if it did not. */
const SaveStatus = ({ isPractice, isSubmitted }: { isPractice: boolean; isSubmitted: boolean }) => {
  const submitExam = useTestPaperStore((state) => state.submitExam);
  const request = useRequest(useTestPaperStore, 'submitResult');
  if (isPractice || !isSubmitted) return null;
  if (request.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Saving your result…
      </div>
    );
  }
  if (request.isFailed) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <WarningCircleIcon weight="fill" className="h-5 w-5 shrink-0 text-destructive" />
          Your result could not be saved. {request.error}
        </span>
        <Button
          isSecondary
          className="shrink-0 px-3 py-1.5"
          onClick={submitExam}
          leftsection={<ArrowClockwiseIcon weight="bold" className="h-4 w-4" />}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (request.isLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircleIcon weight="fill" className="h-5 w-5" />
        Result saved to your account
      </div>
    );
  }
  return null;
};

interface IProps {
  analytics: IResultAnalytics;
}

/**
 * The headline: the score as the one big number, the percentage as a ring beside it, a verdict in
 * words, and the four figures that qualify it.
 */
export const ScoreHero = ({ analytics }: IProps) => {
  const { exam, marksObtained, percent, accuracy, attempted, questions, averageTime } = analytics;
  const verdict = getVerdict(percent);

  return (
    <section className="rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-6 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={exam.isPractice ? 'info' : 'primary'}>{exam.isPractice ? 'Practice' : 'Test'}</Badge>
            <span className="truncate text-sm text-muted-foreground">{exam.title}</span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-semibold leading-none tracking-tight text-foreground md:text-6xl">
              {marksObtained}
            </span>
            <span className="pb-1 text-lg text-muted-foreground">/ {exam.maxMarks} marks</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={verdict.tone}>{verdict.text}</Badge>
            <span className="text-sm text-muted-foreground">
              {attempted} of {questions.length} questions answered
            </span>
          </div>
          <div className="mt-4">
            <SaveStatus isPractice={exam.isPractice} isSubmitted={exam.isSubmitted} />
          </div>
        </div>
        <div className="flex shrink-0 justify-center">
          <CircularProgress
            value={percent}
            thickness={10}
            size={148}
            className={VERDICT_RING[verdict.tone]}
            label={
              <div className="text-center">
                <div className="text-3xl font-semibold leading-none text-foreground">{percent}%</div>
                <div className={cn('mt-1 text-xs font-medium uppercase tracking-caps text-muted-foreground')}>
                  Score
                </div>
              </div>
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4 md:grid-cols-4 md:px-8">
        <StatTile icon={CrosshairIcon} value={`${accuracy}%`} label="Accuracy" />
        <StatTile icon={ListChecksIcon} value={`${attempted} / ${questions.length}`} label="Answered" />
        <StatTile icon={TimerIcon} value={formatSeconds(exam.totalSpendTime)} label="Time taken" />
        <StatTile icon={GaugeIcon} value={formatSeconds(averageTime)} label="Per question" />
      </div>
    </section>
  );
};
