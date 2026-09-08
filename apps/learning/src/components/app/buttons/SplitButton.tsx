import { IMenuItem } from '@interfaces';
import { CaretDown } from '@phosphor-icons/react';
import * as React from 'react';
import { Menu } from '../menus';
import { Button } from '@parthhub/ui/app';

interface IProps {
  text: string;
  onClick: () => void;
  menuItems: IMenuItem[];
}

export const SplitButton = ({ text, menuItems, onClick }: IProps) => {
  return (
    <div className="inline-flex rounded-sm border border-color-border">
      <Button className="!rounded-l-sm rounded-r-none px-3 md:px-4 border-0" text={text} onClick={onClick} />
      <Menu
        menuItems={menuItems}
        component={
          <Button className="!rounded-l-none !rounded-r-sm h-full px-2 md:px-2 border-0">
            <CaretDown weight="fill" className="w-5" />
          </Button>
        }
        className="!px-0 border-l border-color-border"
      />
    </div>
  );
};
