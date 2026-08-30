import { Spinner } from '@components/app';
import { AuthButton } from '@enums';

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
      <div className="flex justify-center space-x-3 items-center px-4 py-2 w-36 h-12 border border-color-border rounded-sm bg-white">
        {isLoading ? (
          <Spinner className="w-8 h-8" />
        ) : (
          <>
            <img src={BUTTON_IMAGES[name]} alt={`${name} auth button`} className="h-6 w-auto" />
            <span className="text-lg font-rubik text-gray-600">{name}</span>
          </>
        )}
      </div>
    </button>
  );
};
