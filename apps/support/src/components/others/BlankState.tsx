import { TrayIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import { type ReactNode } from 'react';

interface IProps {
  /** The headline, e.g. "No chapters found". */
  label?: string;
  /** One line of context under the label — why it is empty, or what to do next. */
  description?: string;
  /** A call to action, typically the same button the populated screen uses to add the first item. */
  action?: ReactNode;
  /** Size classes for the mark. Compact callers (a select dropdown) pass something smaller. */
  iconSize?: string;
  className?: string;
}

/**
 * The empty state.
 *
 * Drawn with an icon rather than an image on purpose. This used to be
 * `<img src="/images/empty-data-3.svg">` — a file that does not exist, so every empty screen
 * rendered a broken image — and the asset it meant to point at is filled `#cbd4db`, which is 1.5:1
 * against a white page and therefore invisible in light mode either way. An icon inherits
 * `currentColor`, so one `text-muted-foreground` is legible in both themes and there is no asset
 * to go missing.
 */
export const BlankState = ({ label, description, action, iconSize, className }: IProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}>
      <span className="flex items-center justify-center rounded-full bg-muted p-3">
        <TrayIcon className={cn('text-muted-foreground', iconSize ?? 'h-6 w-6')} />
      </span>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-foreground">{label ?? 'Nothing here yet'}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
};
