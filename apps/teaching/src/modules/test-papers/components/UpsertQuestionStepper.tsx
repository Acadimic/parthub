import { Stepper } from '@components/app/steppers';
import { type IStep } from '@interfaces';
import { useSelectorLookups } from '@stores';
import { AddQuestion } from './AddQuestion';
import { AddSolution } from './AddSolution';

export const UpsertQuestionStepper = () => {
  const selectorStore = useSelectorLookups();
  const { selectedUpsertQuestionStep } = selectorStore;

  const steps: IStep[] = [
    {
      label: 'Add Question',
      component: <AddQuestion />,
    },
    {
      label: 'Add Solution',
      component: <AddSolution />,
    },
  ];

  return (
    <div className="w-full h-full md:px-4">
      <Stepper steps={steps} activeStep={selectedUpsertQuestionStep} />
    </div>
  );
};
