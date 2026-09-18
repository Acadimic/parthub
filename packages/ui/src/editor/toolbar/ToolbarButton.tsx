import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';

/**
 * Pressing a toolbar control moves focus out of the editor, and the browser collapses the text
 * selection when it goes. Block commands survive that because they only need the caret position —
 * which is why headings and lists appeared to work while Bold silently did nothing to the selected
 * words. Every control here suppresses the default mousedown so focus, and the selection, stay put.
 */
export const keepSelection = (event: React.MouseEvent) => event.preventDefault();

/** The one set of classes every control in a group shares, so a group reads as a unit. */
export const CONTROL_CLASS =
  'flex h-7 items-center justify-center rounded text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 disabled:pointer-events-none';

export interface IToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  /** For an action that removes something: red on hover. */
  isDanger?: boolean;
}

/** A square icon control. `label` is the tooltip and the accessible name. */
export const ToolbarButton = ({ label, icon, isActive, isDisabled, isDanger, onClick }: IToolbarButtonProps) => (
  <Tooltip title={label}>
    <button
      type="button"
      onMouseDown={keepSelection}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      aria-pressed={isDanger ? undefined : Boolean(isActive)}
      className={cn(
        CONTROL_CLASS,
        'w-7',
        isDanger && 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        !isDanger && isActive && 'bg-primary/10 text-primary',
        !isDanger && !isActive && 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {icon}
    </button>
  </Tooltip>
);

/** A labelled control, for the actions that are the point of this editor. */
export const ToolbarAction = ({
  label,
  icon,
  onClick,
  title,
  className,
}: Omit<IToolbarButtonProps, 'isActive'> & { title: string; className?: string }) => (
  <Tooltip title={title}>
    <button
      type="button"
      onMouseDown={keepSelection}
      onClick={onClick}
      className={cn(CONTROL_CLASS, 'gap-1.5 px-2 text-foreground hover:bg-primary/10 hover:text-primary', className)}
    >
      {icon}
      {label}
    </button>
  </Tooltip>
);

/**
 * A segment: the controls of one intent on a shared ground with a shared border, so the eye reads
 * five marks as one thing and two list buttons as another. Groups sit apart by a gap rather than
 * by hairline rules, which at this density blurred into the buttons.
 */
export const ToolbarGroup = ({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  /** Names the group for assistive technology; sighted users get the grouping from the border. */
  label?: string;
}) => (
  <div
    role="group"
    aria-label={label}
    className={cn('inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5', className)}
  >
    {children}
  </div>
);
