import { CheckIcon } from '@phosphor-icons/react';
import { observer } from 'mobx-react-lite';

const steps = ['Select campaign settings', 'Create an ad group'];

interface StepIconProps {
  active?: boolean;
  completed?: boolean;
}

function StepIcon({ active, completed }: StepIconProps) {
  return (
    <div className="flex items-center h-[22px]">
      {completed ? (
        <CheckIcon weight="bold" className="w-[18px] h-[18px] text-violet-primary z-10" />
      ) : (
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-violet-primary' : 'bg-[#eaeaf0] dark:bg-grey-primary'}`} />
      )}
    </div>
  );
}

export const TestPaperStepper = observer(() => {
  const activeStep = 1;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        {steps.map((label, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <StepIcon active={isActive} completed={isCompleted} />
                <span className="mt-2 text-sm text-color-primary">{label}</span>
              </div>
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-[3px] rounded ${isCompleted ? 'bg-violet-primary' : 'bg-[#eaeaf0] dark:bg-grey-primary'}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
