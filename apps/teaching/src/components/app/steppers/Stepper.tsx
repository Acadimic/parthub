import { type IStep } from '@interfaces';
import { CheckIcon } from '@phosphor-icons/react';

interface IProps {
  steps: IStep[];
  activeStep: number;
}

export const Stepper = ({ steps, activeStep }: IProps) => {
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
                    isCompleted || isActive ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon weight="bold" className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <div
                  className={`text-xs mt-1 text-center ${isActive ? 'font-medium text-info' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mt-[-16px] ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div>{currentStep.component}</div>
    </div>
  );
};
