import { IStep } from '@interfaces';
import { Check } from '@phosphor-icons/react';
import { observer } from 'mobx-react-lite';

interface IProps {
  steps: IStep[];
  activeStep: number;
}

export const Stepper = observer(({ steps, activeStep }: IProps) => {
  const currentStep = steps[activeStep];

  if (!currentStep) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        {steps.map((step: IStep, index: number) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isCompleted
                      ? 'bg-blue-primary text-white'
                      : isActive
                        ? 'bg-blue-primary text-white'
                        : 'bg-color-border text-color-secondary'
                  }`}
                >
                  {isCompleted ? (
                    <Check weight="bold" className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <div
                  className={`text-xs mt-1 text-center ${isActive ? 'font-medium text-blue-primary' : 'text-color-secondary'}`}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mt-[-16px] ${isCompleted ? 'bg-blue-primary' : 'bg-color-border'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div>{currentStep.component}</div>
    </div>
  );
});
