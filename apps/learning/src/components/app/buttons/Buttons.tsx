import { Spinner } from '..';

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
      className={`${className ? className : 'px-3 md:px-4 py-1.5'} select-none text-sm font-semibold border hover:opacity-80
        ${isRound ? 'rounded-full' : 'rounded-none'}
        ${isSecondary ? 'bg-color-opposite' : isSubtle ? 'bg-transparent' : 'bg-color-primary border-color-primary text-color-opposite'}
        ${isLoading ? 'opacity-80' : ''}
        ${isSubtle ? 'border-transparent' : 'border-color-border'}
        ${isFull ? 'w-full text-center' : ''}
      `}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <div className="flex space-x-2.5 items-center">
        {leftsection ? <div className="flex items-center">{leftsection}</div> : null}
        <div
          className={`text-inherit ${isFull && isLoading ? 'hidden' : 'flex-1'} ${leftsection ? 'pr-1.5' : rightsection ? 'pl-1.5' : ''}`}
        >
          {text || children}
        </div>
        {isLoading && !hideLoadingIcon ? (
          <div className={`${isFull && isLoading ? 'flex-1 flex justify-center' : ''}`}>
            <Spinner />
          </div>
        ) : rightsection ? (
          <div className="flex items-center">{rightsection}</div>
        ) : null}
      </div>
    </button>
  );
};
