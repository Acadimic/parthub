import { AsteriskIcon } from '@phosphor-icons/react';

interface IProps {
  title: string;
  /** One line under the title saying what belongs here or what happens next. */
  hint?: string;
  isRequired?: boolean;
  /** A small control at the right of the title — "Add option", say. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One titled block of a drawer form.
 *
 * The drawer used to stack a dozen unlabelled controls; a title per block is what lets the eye
 * find "Marks" or "Solution" without reading every label, and the hint is where the one sentence
 * of guidance a first-time author needs goes.
 */
export const DrawerSection = ({ title, hint, isRequired, action, children }: IProps) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground">
          {title}
          {isRequired ? (
            <AsteriskIcon className="h-3 w-3 text-destructive" weight="bold" aria-label="required" />
          ) : null}
        </h3>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0 whitespace-nowrap">{action}</div> : null}
    </div>
    {children}
  </section>
);
