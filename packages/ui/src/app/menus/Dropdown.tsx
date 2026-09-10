import { CaretDownIcon } from '@phosphor-icons/react';
import { type IMenuItem } from '../../types';
import { Button } from '../buttons';
import { Menu } from './Menu';

export interface IDropdownProps {
  selected: string;
  menuItems: IMenuItem[];
  component?: React.ReactNode;
}

export const Dropdown = ({ menuItems, selected, component }: IDropdownProps) => {
  return (
    <Menu
      menuItems={menuItems}
      component={
        <div className="border border-border">
          <Button isSubtle className="px-4 py-1.5" rightsection={<CaretDownIcon weight="bold" />}>
            {component || selected}
          </Button>
        </div>
      }
      className="px-0"
    />
  );
};
