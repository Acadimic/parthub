import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';

/**
 * Pressing a toolbar control moves focus out of the editor, and the browser collapses the text
 * selection when it goes. Block commands survive that because they only need the caret position —
 * which is why headings and lists appeared to work while Bold silently did nothing to the selected
 * words. Every control here suppresses the default mousedown so focus, and the selection, stay put.
 */
export const keepSelection = (event: React.MouseEvent) => event.preventDefault();

export interface IToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

/** A square icon control. `label` is the tooltip and the accessible name. */
export const ToolbarButton = ({ label, icon, isActive, isDisabled, onClick }: IToolbarButtonProps) => (
  <Tooltip title={label}>
    <button
      type="button"
      onMouseDown={keepSelection}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      aria-pressed={Boolean(isActive)}
      className={cn(
        'flex h-8 w-8 items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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
      className={cn(
        'flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-colors',
        'hover:border-primary hover:bg-primary/10 hover:text-primary',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  </Tooltip>
);

/**
 * Groups are separated by space and a hairline, not by space alone — at this density the eye needs
 * the rule to find the boundary.
 */
export const ToolbarGroup = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
  <div className={cn('flex items-center gap-0.5 px-1', !isLast && 'border-r border-border')}>{children}</div>
);
