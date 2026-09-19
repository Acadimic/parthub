import { ArrowRightIcon, CheckCircleIcon, CircleIcon } from '@phosphor-icons/react';
import Link from 'next/link';

export interface ISetupStep {
  label: string;
  href: string;
  isDone: boolean;
}

interface IProps {
  steps: ISetupStep[];
}

/**
 * A checklist of the first things a workspace needs, shown until every one is done. A new
 * teacher used to land on four empty carousels; this says what to do first and where.
 */
export const GettingStarted = ({ steps }: IProps) => {
  const done = steps.filter((step) => step.isDone).length;
  const percent = Math.round((done / steps.length) * 100);
  if (done === steps.length) return null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-background p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">Getting started</h3>
        <span className="text-xs text-muted-foreground">
          {done} of {steps.length}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {steps.map((step) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {step.isDone ? (
                <CheckCircleIcon weight="fill" className="h-4.5 w-4.5 shrink-0 text-success" />
              ) : (
                <CircleIcon className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
              )}
              <span className={step.isDone ? 'flex-1 text-muted-foreground line-through' : 'flex-1 text-foreground'}>
                {step.label}
              </span>
              {!step.isDone ? (
                <ArrowRightIcon
                  weight="bold"
                  className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
