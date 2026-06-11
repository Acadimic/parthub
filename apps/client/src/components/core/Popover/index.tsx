import MuiPopover, { PopoverOrigin } from '@mui/material/Popover';
import * as React from 'react';

interface IPopoverProps {
  children: React.ReactNode;
  trigger: React.ReactElement;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
}

export const Popover = ({ children, trigger, anchorOrigin, transformOrigin }: IPopoverProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'core-popover' : undefined;

  return (
    <div>
      <div aria-describedby={id} className="cursor-pointer" onClick={handleClick}>
        {trigger}
      </div>
      <MuiPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={anchorOrigin || { vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={transformOrigin}
        elevation={0}
        marginThreshold={16}
        classes={{
          paper: 'bg-background-primary border border-color-border rounded-sm mt-2',
        }}
      >
        <div>
          {typeof children === 'function'
            ? (children as (props: { handleClose: () => void }) => React.ReactNode)({ handleClose })
            : children}
        </div>
      </MuiPopover>
    </div>
  );
};

export type { IPopoverProps };
