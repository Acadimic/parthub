import { PauseCircleIcon, PlayCircleIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { getTimeString } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { useSetState } from 'react-use';
import { Button } from '../buttons';

interface IProps {
  isActiveTimer: boolean;
  toggleTimer: () => void;
  handleSubmitTest: () => void;
}

interface IState {
  timeLeft: number;
  timeLeftString: string;
}

export const Timer = observer(({ toggleTimer, isActiveTimer, handleSubmitTest }: IProps) => {
  const { testPaperStore } = useStores();
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
        exam.increaseSelectedQuestionTimeSpend();
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

  return (
    <div className="flex items-center space-x-1">
      {exam.isSubmitted ? null : (
        <Button onClick={toggleTimer} isSubtle className="px-1 md:px-4">
          {isActiveTimer ? (
            <PauseCircleIcon className="w-6 h-6 text-blue-primary" />
          ) : (
            <PlayCircleIcon className="w-6 h-6 text-blue-primary" />
          )}
        </Button>
      )}
      <div className="w-16 blue-gradient text-sm font-semibold">{state.timeLeftString}</div>
    </div>
  );
});
