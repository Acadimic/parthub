import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { PauseIcon, PlayIcon, TimerIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';
import { getTimeString } from '@utils/helpers';
import { useEffect, useRef } from 'react';
import { useSetState } from 'react-use';

interface IProps {
  isActiveTimer: boolean;
  toggleTimer: () => void;
  handleSubmitTest: () => void;
}

interface IState {
  timeLeft: number;
  timeLeftString: string;
}

/** Under this many seconds left, the clock turns red. */
const WARNING_SECONDS = 5 * 60;

export const Timer = ({ toggleTimer, isActiveTimer, handleSubmitTest }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useSetState<IState>({
    timeLeft: 0,
    timeLeftString: getTimeString(0),
  });

  const setInitialTimeLeft = (seconds: number) => {
    setState({
      timeLeft: seconds,
      timeLeftString: getTimeString(seconds),
    });
  };

  useEffect(() => {
    if (!exam) return;
    const { timeLeft } = state;
    if (isActiveTimer && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const newTimeLeft = timeLeft - 1;
        setState({ timeLeft: newTimeLeft, timeLeftString: getTimeString(newTimeLeft) });
        testPaperStore.increaseSelectedQuestionTimeSpend();
      }, 1000);
    }

    if (isActiveTimer && timeLeft === 0) handleSubmitTest();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActiveTimer, state.timeLeft]);

  useEffect(() => {
    if (intervalRef.current && isActiveTimer === false) clearInterval(intervalRef.current);
  }, [isActiveTimer]);

  useEffect(() => {
    if (exam?.durationMins) setInitialTimeLeft(exam?.durationMins * 60);
  }, [exam?._id]);

  if (!exam) return null;

  const isLow = !exam.isSubmitted && state.timeLeft > 0 && state.timeLeft < WARNING_SECONDS;

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-1',
        isLow
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border bg-muted/50 text-foreground',
      )}
    >
      {exam.isSubmitted ? (
        <TimerIcon weight="bold" className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Button
          onClick={toggleTimer}
          isSubtle
          aria-label={isActiveTimer ? 'Pause the test' : 'Resume the test'}
          className="rounded-full p-0.5"
          leftsection={
            isActiveTimer ? (
              <PauseIcon weight="fill" className="h-4 w-4" />
            ) : (
              <PlayIcon weight="fill" className="h-4 w-4" />
            )
          }
        />
      )}
      <span className="w-[4.5rem] text-center font-mono text-sm font-semibold tabular-nums">
        {state.timeLeftString}
      </span>
    </div>
  );
};
