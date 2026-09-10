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

const getVariantClass = ({ isSecondary, isSubtle }: ButtonVariant) => {
  if (isSecondary) return 'bg-background border-border text-foreground';
  if (isSubtle) return 'bg-transparent border-transparent';
  return 'bg-primary border-primary text-primary-foreground';
};

const getButtonClass = (variant: ButtonVariant) =>
  cn(
    'select-none text-sm font-semibold border hover:opacity-80 transition-opacity',
    variant.isRound ? 'rounded-full' : 'rounded-none',
    getVariantClass(variant),
    variant.isLoading && 'opacity-80',
    variant.isFull ? 'w-full text-center' : '',
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
  return (
    <button
      className={getButtonClass({ isRound, isSecondary, isSubtle, isLoading, isFull, className })}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      <div className="flex space-x-2.5 items-center">
        {leftSection ? <div className="flex items-center">{leftSection}</div> : null}
        <div
          className={cn(
            'text-inherit',
            isFull && isLoading ? 'hidden' : 'flex-1',
            getSectionPadding(leftSection, rightSection),
          )}
        >
          {text || children}
        </div>
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
