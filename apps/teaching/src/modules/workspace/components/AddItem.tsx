import { Card, Link } from '@components/app';
import { Plus } from '@phosphor-icons/react';
import React from 'react';

interface IProps {
  /**
   * Text to display next to the add icon
   */
  text: string;
  /**
   * Optional click handler
   */
  href: string;
  /**
   * Optional class name for additional styling
   */
  className?: string;
  /**
   * Optional disabled state
   */
  isDisabled?: boolean;
}

export const AddItem: React.FC<IProps> = ({ text, href, isDisabled = false }) => {
  return (
    <Card className="h-full w-full border border-color-border">
      {' '}
      <Link isSecondary href={href} disabled={isDisabled} className="w-full h-full">
        <div className="flex justify-center py-4">
          <Plus weight="bold" className="w-8 h-8" />
        </div>
        {text}{' '}
      </Link>
    </Card>
  );
};
