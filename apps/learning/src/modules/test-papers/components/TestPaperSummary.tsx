import { CheckCircleIcon, Icon, MinusCircleIcon, RadioButtonIcon, TimerIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { getTimeString, getTwoDigit } from '@utils/helpers';
import { observer } from 'mobx-react-lite';

interface IProps {
  // timeLeftString: string;
}

interface IRow {
  label: string;
  value: string;
  className?: string;
  icon: Icon;
}

export const TestPaperSummary = observer(({}: IProps) => {
  const { testPaperStore } = useStores();
  const { exam } = testPaperStore;

  if (!exam) return <></>;

  const { attemptedCount, numberOfQuestions, markedForReviews, timeLeft } = exam;

  const rows = [
    { icon: TimerIcon, label: 'Time Left', value: getTimeString(timeLeft), className: 'w-16' },
    { icon: CheckCircleIcon, label: 'Attempted', value: String(getTwoDigit(attemptedCount)), className: '' },
    {
      icon: MinusCircleIcon,
      label: 'Unattempted',
      value: String(getTwoDigit(numberOfQuestions - attemptedCount)),
      className: '',
    },
    {
      icon: RadioButtonIcon,
      label: 'Marked For Review',
      value: String(getTwoDigit(markedForReviews.length)),
      className: '',
    },
  ];

  return (
    <div className="w-full">
      <div className="w-full px-2 py-6">
        <div className="">
          {rows.map((row: IRow) => {
            return (
              <div key={row.label} className="px-1 flex justify-between border-b border-color-border py-2">
                <div>
                  <div className="flex items-center space-x-2 blue-gradient">
                    <row.icon className="w-5 font-bold text-blue-primary" />
                    <div className="text-sm font-semibold">{row.label}</div>
                  </div>
                </div>
                <div className={`flex justify-end pr-0.5 purple-gradient`}>
                  <div className={`${row.className} whitespace-nowrap text-sm font-semibold`}>{row.value}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 mb-2">
          <div className="text-center text-sm font-semibold">Are you sure want to submit the test?</div>
        </div>
      </div>
    </div>
  );
});
