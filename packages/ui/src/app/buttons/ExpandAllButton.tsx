import { ArrowsInLineVerticalIcon, ArrowsOutLineVerticalIcon } from '@phosphor-icons/react';
import { Button } from './Buttons';

interface IProps {
  isAllExpanded: boolean;
  onClick: () => void;
  /** Replaces the button's padding and type size, as on `Button`. */
  className?: string;
}

/** The one control that opens or folds every row of a list; pairs with `useExpandedIds`. */
export const ExpandAllButton = ({ isAllExpanded, onClick, className }: IProps) => {
  const Icon = isAllExpanded ? ArrowsInLineVerticalIcon : ArrowsOutLineVerticalIcon;
  return (
    <Button
      isSubtle
      aria-expanded={isAllExpanded}
      className={className}
      leftsection={<Icon className="h-4 w-4" />}
      text={isAllExpanded ? 'Collapse all' : 'Expand all'}
      onClick={onClick}
    />
  );
};
