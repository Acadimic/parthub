import { SignInWithGoogleButton, SignInWithMicrosoftButton } from '.';

interface IProps {
  isDisabled: boolean;
  setLoading: (loading: boolean) => void;
}

export const SignInButtons = ({ isDisabled, setLoading }: IProps) => {
  return (
    <div className="flex flex-col justify-start gap-3 items-center md:gap-4 min-w-[300px]">
      <SignInWithGoogleButton isDisabled={isDisabled} setLoading={setLoading} />
      <SignInWithMicrosoftButton isDisabled={isDisabled} setLoading={setLoading} />
    </div>
  );
};
