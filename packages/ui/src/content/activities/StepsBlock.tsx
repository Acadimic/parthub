import { ArrowCounterClockwiseIcon, FootprintsIcon } from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';
import { ActivityFrame, OUTLINE_PILL } from './ActivityFrame';
import { StepNav } from './StepNav';

export interface IStep {
  /** The line the step is about, shown large: a word, a form, a sentence. */
  display: ReactNode;
  /** What changed and why, under it. */
  caption: ReactNode;
}

/**
 * A rule shown happening, one step at a time: a stem, then its ending, then the next form. The part
 * that changed is written bold and shows highlighted, and each step arrives with a small pop, so the
 * eye goes to the change. Print lists every step.
 */
export const StepsBlock = ({ steps }: { steps: IStep[] }) => {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (!step) return null;

  return (
    <ActivityFrame
      icon={FootprintsIcon}
      title={`Step by step · ${index + 1} of ${steps.length}`}
      actions={
        index > 0 ? (
          <button type="button" onClick={() => setIndex(0)} className={OUTLINE_PILL}>
            <ArrowCounterClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
            Start over
          </button>
        ) : null
      }
    >
      <div className="print:hidden">
        <div key={index} className="flex min-h-36 flex-col items-center justify-center gap-2 py-4 text-center">
          <div className="text-3xl leading-snug animate-pop-in [&_p]:my-0 [&_strong]:rounded-sm [&_strong]:bg-primary/15 [&_strong]:px-0.5">
            {step.display}
          </div>
          <div className="max-w-prose text-sm text-muted-foreground animate-fade-in [&_p]:my-0.5">{step.caption}</div>
        </div>
        <StepNav index={index} count={steps.length} onChange={setIndex} noun="step" />
      </div>
      <ol className="hidden list-decimal pl-5 print:block [&_p]:my-0.5">
        {steps.map((item, number) => (
          <li key={number} className="py-1">
            <div className="text-lg [&_strong]:underline">{item.display}</div>
            <div className="text-sm">{item.caption}</div>
          </li>
        ))}
      </ol>
    </ActivityFrame>
  );
};
