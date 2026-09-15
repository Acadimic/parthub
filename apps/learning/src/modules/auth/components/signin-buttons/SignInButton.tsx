import { AuthButton } from '@enums';
import { Spinner } from '@repo/ui/app';

const BUTTON_IMAGES = {
  [AuthButton.GOOGLE]: '/images/google.svg',
  [AuthButton.MICROSOFT]: '/images/microsoft.svg',
};

interface IProps {
  name: AuthButton;
  isLoading: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}

export const SignInButton = ({ name, isLoading, onClick, isDisabled }: IProps) => {
  const disabled = isLoading || isDisabled;
  return (
    <button
      className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex justify-center`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex min-w-[260px] justify-center space-x-3 items-center px-4 py-2 w-36 h-12 border border-border rounded-none bg-background">
        {isLoading ? (
          <Spinner className="w-8 h-8" />
        ) : (
          <div className="flex w-full items-center">
            <img src={BUTTON_IMAGES[name]} alt={`${name} auth button`} className="h-6 w-auto" />
            <div className="flex-1 text-center text-sm text-foreground">Continue with {name}</div>
          </div>
        )}
      </div>
    </button>
  );
};
