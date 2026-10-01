import { cn } from '@repo/ui/lib';
import { type ReactNode } from 'react';

interface IProps {
  title: string;
  description?: string;
  /** Controls in the header's right corner: a view toggle, a tab strip. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One panel of the result page: a title row, then its content. */
export const ResultCard = ({ title, description, actions, children, className }: IProps) => (
  <section className={cn('flex flex-col rounded-xl border border-border bg-background shadow-sm', className)}>
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </header>
    <div className="px-5 pb-5 pt-4">{children}</div>
  </section>
);
