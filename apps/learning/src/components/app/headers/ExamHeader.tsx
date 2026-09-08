import { DotsNineIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { ToggleTheme } from '@repo/ui/app';
import { Timer } from './';

interface IProps {
  isPractice?: boolean;
  toggleTimer: () => void;
  isActiveTimer: boolean;
  handleSubmitTest: () => void;
}

export const ExamHeader = observer(({ isPractice, toggleTimer, isActiveTimer, handleSubmitTest }: IProps) => {
  const { testPaperStore } = useStores();
  const { exam } = testPaperStore;
  if (!exam) return null;
  const { title } = exam;

  return (
    <>
      <div className="w-full h-14 xl:h-16 header-shadow relative border-b border-color-border">
        <div className="px-4 md:px-8 h-full">
          <div className="flex justify-between items-center h-full space-x-6">
            <div
              className={`flex ${
                isPractice ? 'w-[80%]' : 'w-[50%]'
              } justify-start items-center font-bold text-sm space-x-2`}
            >
              <div className="">
                <DotsNineIcon weight="bold" className="w-5 h-5 text-blue-primary" />
              </div>
              <div className="truncate">{title}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`${isPractice ? 'hidden' : 'flex items-center space-x-4'}`}>
                <Timer isActiveTimer={isActiveTimer} toggleTimer={toggleTimer} handleSubmitTest={handleSubmitTest} />
              </div>
              <ToggleTheme />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
