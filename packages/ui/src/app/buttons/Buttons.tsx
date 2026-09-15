import { Spinner } from '../loaders/Spinner';

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  isRound?: boolean;
  isSecondary?: boolean;
  isSubtle?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  hideLoadingIcon?: boolean;
  leftsection?: React.ReactNode;
  rightsection?: React.ReactNode;
  className?: string;
  isFull?: boolean;
}

type ButtonVariant = Pick<IButtonProps, 'isRound' | 'isSecondary' | 'isSubtle' | 'isLoading' | 'isFull' | 'className'>;

const getVariantClass = ({ isSecondary, isSubtle }: ButtonVariant) => {
  if (isSecondary) return 'bg-background hover:bg-accent';
  if (isSubtle) return 'bg-transparent hover:bg-accent';
  return 'bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90';
};

const getButtonClass = (variant: ButtonVariant) =>
  `${variant.className ?? 'px-3 md:px-4 py-1.5'} select-none text-sm font-semibold border transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:opacity-50 disabled:pointer-events-none
        ${variant.isRound ? 'rounded-full' : 'rounded-md'}
        ${getVariantClass(variant)}
        ${variant.isLoading ? 'opacity-80' : ''}
        ${variant.isSubtle ? 'border-transparent' : 'border-border'}
        ${variant.isFull ? 'w-full text-center' : ''}
      `;

const getSectionPadding = (leftsection?: React.ReactNode, rightsection?: React.ReactNode) => {
  if (leftsection) return 'pr-1.5';
  if (rightsection) return 'pl-1.5';
  return '';
};

const TrailingSlot = ({
  isLoading,
  hideLoadingIcon,
  isFull,
  rightsection,
}: Pick<IButtonProps, 'isLoading' | 'hideLoadingIcon' | 'isFull' | 'rightsection'>) => {
  if (isLoading && !hideLoadingIcon) {
    return (
      <div className={`${isFull && isLoading ? 'flex-1 flex justify-center' : ''}`}>
        <Spinner />
      </div>
    );
  }
  if (rightsection) return <div className="flex items-center">{rightsection}</div>;
  return null;
};

export const Button = ({
  children,
  text,
  onClick,
  isRound,
  isSecondary,
  isLoading,
  disabled,
  isSubtle,
  hideLoadingIcon,
  leftsection,
  rightsection,
  className,
  isFull,
}: IButtonProps) => {
  return (
    <button
      className={getButtonClass({ isRound, isSecondary, isSubtle, isLoading, isFull, className })}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <div className="flex space-x-2.5 items-center">
        {leftsection ? <div className="flex items-center">{leftsection}</div> : null}
        <div
          className={`text-inherit ${isFull && isLoading ? 'hidden' : 'flex-1'} ${getSectionPadding(leftsection, rightsection)}`}
        >
          {text || children}
        </div>
        <TrailingSlot
          isLoading={isLoading}
          hideLoadingIcon={hideLoadingIcon}
          isFull={isFull}
          rightsection={rightsection}
        />
      </div>
    </button>
  );
};
