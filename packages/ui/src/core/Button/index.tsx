import { cn } from '../../lib/cn';
import { Spinner } from '../Spinner';

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  isRound?: boolean;
  isSecondary?: boolean;
  isSubtle?: boolean;
  isLoading?: boolean;
  hideLoadingIcon?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  className?: string;
  isFull?: boolean;
}

type ButtonVariant = Pick<IButtonProps, 'isRound' | 'isSecondary' | 'isSubtle' | 'isLoading' | 'isFull' | 'className'>;

/**
 * Hover shifts the fill rather than the whole button's opacity. Opacity fades the label and the
 * border with the background, so a hovered button reads as disabled; it also lets whatever sits
 * behind it bleed through. The alpha is on the token instead, which only resolves because the
 * palette is emitted as bare HSL channels — see `themes/tailwind.ts`.
 */
const getVariantClass = ({ isSecondary, isSubtle }: ButtonVariant) => {
  if (isSecondary) return 'bg-background border-border text-foreground hover:bg-accent';
  if (isSubtle) return 'bg-transparent border-transparent hover:bg-accent';
  return 'bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90';
};

const getButtonClass = (variant: ButtonVariant) =>
  cn(
    'select-none text-sm font-semibold border transition-colors',
    // Keyboard users had no focus indicator at all before this. `focus-visible` rather than
    // `focus`, so a pointer click does not leave a ring behind.
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:pointer-events-none',
    variant.isRound ? 'rounded-full' : 'rounded-md',
    getVariantClass(variant),
    variant.isLoading && 'opacity-80',
    variant.isFull ? 'w-full text-center' : '',
    // A caller passing `className` replaces the padding rather than adding to it. Long-standing
    // behaviour that several call sites rely on to render a padding-free text button.
    variant.className ?? 'px-3 md:px-4 py-1.5',
  );

const getSectionPadding = (leftSection?: React.ReactNode, rightSection?: React.ReactNode) => {
  if (leftSection) return 'pr-1.5';
  if (rightSection) return 'pl-1.5';
  return '';
};

const TrailingSlot = ({
  isLoading,
  hideLoadingIcon,
  isFull,
  rightSection,
}: Pick<IButtonProps, 'isLoading' | 'hideLoadingIcon' | 'isFull' | 'rightSection'>) => {
  if (isLoading && !hideLoadingIcon) {
    return (
      <div className={cn(isFull && isLoading && 'flex-1 flex justify-center')}>
        <Spinner size="sm" />
      </div>
    );
  }
  if (rightSection) return <div className="flex items-center">{rightSection}</div>;
  return null;
};

export const Button = ({
  children,
  text,
  onClick,
  isRound,
  isSecondary,
  isSubtle,
  isLoading,
  disabled,
  hideLoadingIcon,
  leftSection,
  rightSection,
  className,
  isFull,
  type = 'button',
  ...rest
}: IButtonProps) => {
  // An icon-only button renders no label slot at all: the slot's spacing and padding are what put
  // a gap after the icon and pushed it off centre.
  const label = text || children;
  return (
    <button
      className={getButtonClass({ isRound, isSecondary, isSubtle, isLoading, isFull, className })}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      <div className="flex items-center justify-center gap-2.5">
        {leftSection ? <div className="flex items-center">{leftSection}</div> : null}
        {label ? (
          <div
            className={cn(
              'text-inherit',
              isFull && isLoading ? 'hidden' : 'flex-1',
              getSectionPadding(leftSection, rightSection),
            )}
          >
            {label}
          </div>
        ) : null}
        <TrailingSlot
          isLoading={isLoading}
          hideLoadingIcon={hideLoadingIcon}
          isFull={isFull}
          rightSection={rightSection}
        />
      </div>
    </button>
  );
};
