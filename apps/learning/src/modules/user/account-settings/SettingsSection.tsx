import { cn } from '@repo/ui/lib';
import { type ReactNode } from 'react';

interface ISectionProps {
  title: string;
  description?: string;
  /** Sits at the end of the header row: the Edit or Change button for the section. */
  action?: ReactNode;
  children: ReactNode;
  /** Rendered in a tinted strip under the body; Save and Cancel go here while editing. */
  footer?: ReactNode;
}

/** One card on a settings page: a titled header with an optional action, the body, and an optional footer. */
export const SettingsSection = ({ title, description, action, children, footer }: ISectionProps) => (
  <section className="overflow-hidden rounded-xl border border-border bg-background">
    <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
    <div className="px-5 py-5">{children}</div>
    {footer ? (
      <footer className="flex items-center justify-end gap-2.5 border-t border-border bg-muted/40 px-5 py-3">
        {footer}
      </footer>
    ) : null}
  </section>
);

interface IFieldProps {
  label: string;
  /** The stored value; an empty one renders as "Not set" so a blank cell never looks like a bug. */
  value?: string | null;
  hint?: string;
  className?: string;
}

/** A read-only field in a settings section: small caps label over the value. */
export const FieldValue = ({ label, value, hint, className }: IFieldProps) => (
  <div className={cn('min-w-0', className)}>
    <dt className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">{label}</dt>
    <dd className={cn('mt-1 truncate text-sm', value ? 'font-medium text-foreground' : 'italic text-muted-foreground')}>
      {value || 'Not set'}
    </dd>
    {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);
