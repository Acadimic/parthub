import { Card, CircularProgress, Tooltip } from '@parthhub/ui/app';
import { Marking } from '@enums';
import { CheckIcon, MedalIcon, MinusIcon, PercentIcon, TimerIcon, XIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { getMinutesString, getRatingItem, splitCamelCase } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { SubjectGraph } from './graphs';

export const Result = observer(() => {
  const { testPaperStore } = useStores();
  const { exam } = testPaperStore;
  if (!exam) return;

  const { marksObtained, maxMarks, percentage, accuracy, resultCounts, totalSpendTime } = exam;
  const keys = Object.keys(resultCounts) as Marking[];
  const percentageRatingItem = getRatingItem(percentage);
  const accuracyRatingItem = getRatingItem(accuracy);

  const items = {
    [Marking.CORRECT]: {
      icon: CheckIcon,
      color: 'green',
    },
    [Marking.INCORRECT]: {
      icon: XIcon,
      color: 'red',
    },
    [Marking.UNATTEMPTED]: {
      icon: MinusIcon,
      color: 'gray',
    },
    [Marking.PARTIALLY_CORRECT]: {
      icon: CheckIcon,
      color: 'gray',
    },
  };

  const leftData = [
    {
      name: 'Score',
      value: `${marksObtained} out of ${maxMarks}`,
      icon: MedalIcon,
    },
    {
      name: 'Percentage',
      value: `${percentage}%`,
      icon: PercentIcon,
    },
  ];

  const rightData = [
    {
      name: 'Accuracy',
      value: `${accuracy}%`,
      icon: PercentIcon,
    },
    {
      name: 'Time Taken',
      value: getMinutesString(totalSpendTime),
      icon: TimerIcon,
    },
  ];

  return (
    <div className="w-full h-full flex justify-center items-center py-4 md:py-6">
      <div className="max-w-2xl w-full h-full">
        <div className="flex flex-col pb-8 gap-6">
          <div className="flex justify-center space-x-6 md:space-x-12 items-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <CircularProgress
                thickness={6}
                value={percentage}
                className={`${percentageRatingItem.color}`}
                label={
                  <Tooltip title={percentageRatingItem.text}>
                    <div className="font-bold text-center flex justify-center items-center">
                      <div>
                        <div className="border-b-2 border-color-border min-w-[48px] pb-0.5">{marksObtained}</div>
                        <div className="pt-0.5">{maxMarks}</div>
                      </div>
                    </div>
                  </Tooltip>
                }
              />
              <div className="font-semibold">Score</div>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <CircularProgress
                thickness={6}
                value={accuracy}
                className={`${accuracyRatingItem.color}`}
                label={
                  <Tooltip title={accuracyRatingItem.text}>
                    <div className="font-bold text-center flex justify-center items-center">
                      <div>{accuracy} %</div>
                    </div>
                  </Tooltip>
                }
              />
              <div className="font-semibold">Accuracy</div>
            </div>
          </div>
          <div className={`grid grid-cols-2 ${keys.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mt-2`}>
            {keys.map((key: Marking) => {
              const item = items[key as Marking];
              return (
                <div
                  key={key}
                  className="bg-background-primary text-sm flex py-4 rounded flex-col justify-center border border-color-border items-center space-y-1"
                >
                  <div className="mb-2">
                    <item.icon color={item.color} weight="bold" className="w-5 h-5" />
                  </div>
                  <div className="capitalize font-medium">{splitCamelCase(key)}</div>
                  <div className="font-semibold">{resultCounts[key]}</div>
                  <div className="font-medium text-light-muted dark:text-dark-muted">Questions</div>
                </div>
              );
            })}
          </div>
          <Card>
            <div className="rounded w-full">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-[50%] px-4 md:px-6">
                  <table className="w-full">
                    <tbody>
                      {leftData.map((item) => {
                        return (
                          <tr key={item.name}>
                            <td className="w-[60%] py-2">
                              <div className="flex items-center space-x-2">
                                <div>
                                  <item.icon className="w-6 h-6" />
                                </div>
                                <div className="font-semibold">{item.name}</div>
                              </div>
                            </td>
                            <td className="w-[40%] py-2 text-right pr-1.5 text-sm font-medium">
                              <div>{item.value}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="w-full md:w-[50%] px-4 md:px-6">
                  <table className="w-full">
                    <tbody>
                      {rightData.map((item) => {
                        return (
                          <tr key={item.name}>
                            <td className="w-[60%] py-2">
                              <div className="flex items-center space-x-2">
                                <div>
                                  <item.icon className="w-6 h-6" />
                                </div>
                                <div className="font-semibold">{item.name}</div>
                              </div>
                            </td>
                            <td className="w-[40%] py-2 text-right pr-1.5 text-sm font-medium">
                              <div>{item.value}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="w-full px-2 md:px-4">
              <div className="flex items-center justify-center mb-4">
                <div className="font-semibold">Paper Analysis</div>
              </div>
              <div className="w-full">
                <SubjectGraph />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});
