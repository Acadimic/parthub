import ButtonBase, { ButtonBaseProps } from '@mui/material/ButtonBase';
import { Spinner } from '../Spinner';

export interface IButtonProps extends ButtonBaseProps {
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
    <ButtonBase
      className={`${className || 'px-3 md:px-4 py-1.5'} select-none text-sm font-semibold border hover:opacity-80
        ${isRound ? 'rounded-full' : 'rounded-none'}
        ${isSecondary ? 'bg-color-opposite border-color-border text-color-primary' : isSubtle ? 'bg-transparent border-transparent' : 'bg-blue-primary border-blue-primary text-white'}
        ${isLoading ? 'opacity-80' : ''}
        ${isFull ? 'w-full text-center' : ''}
      `}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      <div className="flex space-x-2.5 items-center">
        {leftSection ? <div className="flex items-center">{leftSection}</div> : null}
        <div
          className={`text-inherit ${isFull && isLoading ? 'hidden' : 'flex-1'} ${leftSection ? 'pr-1.5' : rightSection ? 'pl-1.5' : ''}`}
        >
          {text || children}
        </div>
        {isLoading && !hideLoadingIcon ? (
          <div className={`${isFull && isLoading ? 'flex-1 flex justify-center' : ''}`}>
            <Spinner size="sm" />
          </div>
        ) : rightSection ? (
          <div className="flex items-center">{rightSection}</div>
        ) : null}
      </div>
    </ButtonBase>
  );
};
