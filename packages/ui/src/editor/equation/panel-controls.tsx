import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';

/** The controls the equation panel and its popovers share, so the three surfaces read as one. */

interface IPanelButtonProps {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDanger?: boolean;
}

/** A square icon control in the panel's header strip. */
export const PanelButton = ({ label, children, onClick, isActive, isDanger }: IPanelButtonProps) => (
  <Tooltip title={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex h-7 w-7 items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isDanger && 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        !isDanger && isActive && 'bg-primary/10 text-primary',
        !isDanger && !isActive && 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  </Tooltip>
);

/** The labelled trigger that opens a popover from the panel's tool row. */
export const PanelTrigger = ({ children }: { children: React.ReactNode }) => (
  <button
    type="button"
    className="flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  >
    {children}
  </button>
);

export const PopoverHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{children}</p>
);

/** A small chip that inserts a token, used for state symbols and arrow conditions. */
export const InsertChip = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
}) => (
  <Tooltip title={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 items-center gap-1 border border-border bg-background px-2 text-xs transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {children ?? label}
    </button>
  </Tooltip>
);
