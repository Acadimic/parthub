import { Popover as ShadcnPopover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { cn } from '../../lib/cn';
import * as React from 'react';

type InteractOutsideHandler = NonNullable<React.ComponentProps<typeof PopoverContent>['onInteractOutside']>;

interface IPopoverProps {
  children: React.ReactNode | ((props: { handleClose: () => void }) => React.ReactNode);
  trigger: React.ReactElement;
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | 'center' };
  transformOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | 'center' };
  /** Classes for the popover panel itself. */
  className?: string;
  /**
   * Classes for the element wrapping the trigger. Radix needs a single element there, so the
   * wrapper is always present — without a hook onto it a trigger cannot participate in the
   * caller's layout, which is what stops it being one half of a flex row.
   */
  triggerClassName?: string;
  /**
   * Controlled open state. Pass both, or neither: with `open` set the popover no longer manages
   * itself and reports every change — a click on the trigger, Escape, a click outside — through
   * `onOpenChange` for the caller to apply.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether opening moves focus into the panel. Defaults to true, which is right for a menu; a
   * panel that opens while the user is typing elsewhere passes false so the keyboard stays put.
   */
  autoFocus?: boolean;
  /**
   * Called when the pointer or focus lands outside the panel, just before it closes for that
   * reason. `event.preventDefault()` keeps it open — for a control that drives the panel but sits
   * outside it, such as a search box.
   */
  onInteractOutside?: InteractOutsideHandler;
}

export const Popover = ({
  children,
  trigger,
  anchorOrigin,
  className,
  triggerClassName,
  open,
  onOpenChange,
  autoFocus = true,
  onInteractOutside,
}: IPopoverProps) => {
  const [isOpenInternal, setIsOpenInternal] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isOpenInternal;

  const setOpen = (next: boolean) => {
    if (!isControlled) setIsOpenInternal(next);
    onOpenChange?.(next);
  };

  const handleClose = () => setOpen(false);

  const sideMap: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
    top: 'bottom',
    bottom: 'top',
  };

  const alignMap: Record<string, 'start' | 'center' | 'end'> = {
    left: 'start',
    center: 'center',
    right: 'end',
  };

  const side = anchorOrigin ? sideMap[anchorOrigin.vertical] || 'bottom' : 'bottom';
  const align = anchorOrigin ? alignMap[anchorOrigin.horizontal] || 'start' : 'start';

  return (
    <ShadcnPopover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('cursor-pointer', triggerClassName)}>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        onOpenAutoFocus={autoFocus ? undefined : (event) => event.preventDefault()}
        onInteractOutside={onInteractOutside}
        className={cn('bg-background border border-border rounded-sm mt-2 p-0', className)}
      >
        {typeof children === 'function' ? children({ handleClose }) : children}
      </PopoverContent>
    </ShadcnPopover>
  );
};

export type { IPopoverProps };
