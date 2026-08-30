import { Popover as ShadcnPopover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { cn } from '@utils/cn';
import * as React from 'react';

interface IPopoverProps {
  children: React.ReactNode | ((props: { handleClose: () => void }) => React.ReactNode);
  trigger: React.ReactElement;
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | 'center' };
  transformOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | 'center' };
  className?: string;
}

export const Popover = ({ children, trigger, anchorOrigin, className }: IPopoverProps) => {
  const [open, setOpen] = React.useState(false);

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
    <ShadcnPopover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn('bg-background-primary border border-color-border rounded-sm mt-2 p-0', className)}
      >
        {typeof children === 'function' ? children({ handleClose }) : children}
      </PopoverContent>
    </ShadcnPopover>
  );
};

export type { IPopoverProps };
