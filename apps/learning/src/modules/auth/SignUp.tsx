import { HorizontalLineWithText, Policy, VerticalLineWithText } from '@components/others';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { useState } from 'react';
import { AuthContainer, AuthTitle, EmailPassword, SignInButtons } from './components';
import { InfoTextWithLink } from './components/InfoTextWithLink';
import { useSignUpHook } from './hooks';

export const SignUp = () => {
  const { isLoading, handleSignUpSubmit } = useSignUpHook();
  const [isDisabled, setIsDisabled] = useState(false);
  const { isSmallScreen } = useWindowDimensions();

  return (
    <AuthContainer>
      <AuthTitle text="Create Your Account" />
      <div className="w-full flex flex-col items-center justify-center max-w-full md:flex-row min-h-[280px] gap-3 md:gap-6">
        <EmailPassword handleSubmit={handleSignUpSubmit} isLoading={isLoading} isDisabled={isDisabled} text="Sign Up" />
        {isSmallScreen ? (
          <HorizontalLineWithText text="OR" />
        ) : (
          <div className="h-[240px] mt-2">
            <VerticalLineWithText text="OR" />
          </div>
        )}
        <SignInButtons isDisabled={isDisabled} setLoading={setIsDisabled} />
      </div>
      <Policy />
      <InfoTextWithLink infoText="Already have an account?" linkText="Sign In" href="/sign-in" />
    </AuthContainer>
  );
};
