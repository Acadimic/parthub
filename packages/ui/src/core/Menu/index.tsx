import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { cn } from '../../lib/cn';
import { DotsThreeOutlineVerticalIcon } from '@phosphor-icons/react';
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn('inline cursor-pointer', className || 'px-2.5')}>
          {trigger ?? <DotsThreeOutlineVerticalIcon weight="fill" className="h-5 w-5" />}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border border-border rounded-sm min-w-[180px] p-0">
        {header}
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <DropdownMenuItem
                onClick={() => item.onClick(data)}
                className={cn(
                  'py-3 px-3 text-sm font-medium rounded-sm cursor-pointer',
                  item.isDanger ? 'text-destructive hover:text-destructive' : 'hover:text-primary',
                  item.isCurrent && 'text-primary',
                )}
              >
                {item.icon && <span className="mr-2 text-inherit">{item.icon}</span>}
                {item.label}
              </DropdownMenuItem>
              {(item.isDivider || !isLastItem) && <DropdownMenuSeparator className="m-0" />}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export type { IMenuProps };
