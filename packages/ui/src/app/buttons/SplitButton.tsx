import { type IMenuItem } from '../../types';
import { CaretDownIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { Menu } from '../menus';
import { Button } from './Buttons';

interface IProps {
  text: string;
  onClick: () => void;
  menuItems: IMenuItem[];
}

/**
 * A primary action with a menu of alternatives at its right edge.
 *
 * Both halves carry `Button`'s own vertical padding. A `className` replaces the default padding
 * block wholesale, and the halves used to pass only horizontal padding, which made the control a
 * good deal shorter than the plain button standing next to it.
 */
export const SplitButton = ({ text, menuItems, onClick }: IProps) => {
  return (
    <div className="inline-flex">
      <Button className="!rounded-r-none px-3 md:px-4 py-1.5" text={text} onClick={onClick} />
      <Menu
        menuItems={menuItems}
        component={
          // `flex`, because Menu wraps the trigger in an inline box: an inline-block button in a
          // line box picks up descender space under its baseline and no longer lines up with the
          // text half. The icon sits in a 20px slot — the text half's line height — so both halves
          // measure the same without a fixed height on either.
          <Button className="!rounded-l-none flex px-2 py-1.5 border-l-primary-foreground/30">
            <span className="flex h-5 items-center">
              <CaretDownIcon weight="fill" className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </span>
          </Button>
        }
        className="!px-0"
      />
    </div>
  );
};
