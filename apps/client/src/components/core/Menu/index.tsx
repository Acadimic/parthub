import { ListItemIcon, MenuItem } from '@mui/material';
import { Menu as MuiMenu, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { DotsThreeOutlineVertical } from '@phosphor-icons/react';
import * as React from 'react';

export interface IMenuItem {
  label: string;
  onClick: (data?: unknown) => void;
  icon?: React.ReactNode;
  isDanger?: boolean;
  isCurrent?: boolean;
  isDivider?: boolean;
}

interface IMenuProps {
  items: IMenuItem[];
  trigger?: React.ReactElement;
  data?: unknown;
  className?: string;
  header?: React.ReactNode;
}

export const Menu = ({ items, trigger, data, className, header }: IMenuProps) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      <Box className="flex cursor-pointer justify-center">
        <div
          className={`inline ${className || 'px-2.5'}`}
          onClick={handleClick}
          aria-controls={open ? 'core-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {trigger || <DotsThreeOutlineVertical weight="fill" className="h-5 w-5" />}
        </div>
      </Box>
      <MuiMenu
        anchorEl={anchorEl}
        id="core-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            mt: 2,
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.default',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderTop: `1px solid ${theme.palette.divider}`,
              borderLeft: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        classes={{
          paper: 'border border-color-border rounded-sm min-w-[180px] bg-background-primary',
          list: 'p-0',
        }}
      >
        {header}
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;
          return (
            <MenuItem
              key={index}
              onClick={() => item.onClick(data)}
              className={`hover:bg-transparent py-3 text-sm font-medium min-h-0
                ${item.isDanger ? 'text-red-primary hover:text-red-primary' : 'hover:text-blue-primary'}
                ${item.isCurrent ? 'text-blue-primary' : ''}
              `}
              divider={item.isDivider || !isLastItem}
            >
              {item.icon && <ListItemIcon className="text-inherit min-w-8">{item.icon}</ListItemIcon>}
              {item.label}
            </MenuItem>
          );
        })}
      </MuiMenu>
    </React.Fragment>
  );
};

export type { IMenuProps };
