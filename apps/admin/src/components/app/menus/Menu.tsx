import { IMenuItem } from '@interfaces';
import { DotsThreeOutlineVertical } from '@phosphor-icons/react/dist/ssr';
import * as React from 'react';
import { MenuList } from './MenuList';

interface IProps<T> {
  component?: React.ReactNode;
  menuItems: IMenuItem<T>[];
  data?: T;
  className?: string;
  header?: React.ReactNode;
}

export const Menu = <T,>({ component, menuItems, data, className, header }: IProps<T>) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <div className="flex cursor-pointer justify-center">
        <div
          className={`inline ${className ? className : 'px-2.5'}`}
          onClick={handleClick}
          aria-controls={isOpen ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? 'true' : undefined}
        >
          {component || <DotsThreeOutlineVertical weight="fill" className="h-5 w-5" />}
        </div>
      </div>
      {isOpen && (
        <div
          className="absolute right-0 mt-2 z-50 border border-color-border rounded-sm shadow-lg min-w-[180px] bg-background-primary"
          onClick={handleClose}
        >
          {header}
          <MenuList menuItems={menuItems} data={data} />
        </div>
      )}
    </div>
  );
};
