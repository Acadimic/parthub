import { CheckCircleIcon, type Icon, MinusCircleIcon, RadioButtonIcon, TimerIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';
import { getTimeString, getTwoDigit } from '@utils/helpers';

interface IRow {
  label: string;
  value: string;
  className?: string;
  icon: Icon;
}

export const TestPaperSummary = () => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;

  if (!exam) return <></>;

  const { numberOfQuestions, markedForReviews } = exam;

  const { getAttemptedCount, getTimeLeft } = testPaperStore;

  const rows = [
    { icon: TimerIcon, label: 'Time Left', value: getTimeString(getTimeLeft()), className: 'w-16' },
    { icon: CheckCircleIcon, label: 'Attempted', value: String(getTwoDigit(getAttemptedCount())), className: '' },
    {
      icon: MinusCircleIcon,
      label: 'Unattempted',
      value: String(getTwoDigit(numberOfQuestions - getAttemptedCount())),
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
              <div key={row.label} className="px-1 flex justify-between border-b border-border py-2">
                <div>
                  <div className="flex items-center space-x-2 blue-gradient">
                    <row.icon className="w-5 font-bold text-primary" />
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
};
