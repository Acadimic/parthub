import { cn } from '../../lib/cn';
import { Button } from '../Button';

export interface IChipProps {
  label: React.ReactNode;
  /** Filled when selected, outlined when not. Rendered as `aria-pressed`, so it reads as a toggle. */
  isSelected?: boolean;
  /** A logo, avatar or icon before the label. Sized by the caller — the chip only reserves the slot. */
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  /** Replaces the chip's padding, matching `Button`. */
  className?: string;
}

/**
 * A pill that is either on or off — one value of a filter, a tag, a category.
 *
 * Built on `Button` rather than a `<button>` of its own so the focus ring, the disabled handling
 * and the hover fill stay defined in one place; the two states are that button's two variants.
 */
export const Chip = ({ label, isSelected, leftSection, rightSection, disabled, onClick, className }: IChipProps) => {
  return (
    <Button
      isRound
      isSecondary={!isSelected}
      aria-pressed={!!isSelected}
      disabled={disabled}
      onClick={onClick}
      leftSection={leftSection}
      rightSection={rightSection}
      className={cn('whitespace-nowrap py-1.5', leftSection ? 'pl-1.5 pr-3.5' : 'px-3.5', className)}
    >
      {label}
    </Button>
  );
};
