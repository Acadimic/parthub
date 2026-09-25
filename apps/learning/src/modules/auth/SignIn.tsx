import { HorizontalLineWithText, Policy, VerticalLineWithText } from '@components/others';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { useState } from 'react';
import { AuthContainer, AuthTitle, EmailPassword, SignInButtons } from './components';
import { InfoTextWithLink } from './components/InfoTextWithLink';
import { useSignInHook } from './hooks';

export const SignIn = () => {
  const { isLoading, handleSignInSubmit } = useSignInHook();
  const [isDisabled, setIsDisabled] = useState(false);
  const { isSmallScreen } = useWindowDimensions();

  return (
    <AuthContainer>
      <AuthTitle text="Log into Acadimic" />
      <div className="w-full flex flex-col items-center justify-center max-w-full md:flex-row min-h-[280px] gap-3 md:gap-6">
        <EmailPassword handleSubmit={handleSignInSubmit} isLoading={isLoading} isDisabled={isDisabled} text="Sign In" />
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
      <InfoTextWithLink infoText="Don't have an account?" linkText="Sign Up" href="/sign-up" />
    </AuthContainer>
  );
};
