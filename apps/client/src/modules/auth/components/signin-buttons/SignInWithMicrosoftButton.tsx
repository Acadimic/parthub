import { AuthButton } from '@enums';
import { FirebaseError, getFirebaseErrorMessage, signInWithMicrosoft } from '@utils/firebase';
import { errorToast, getRedirectUri } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SignInButton } from './SignInButton';

interface IProps {
  isDisabled?: boolean;
  setLoading?: (bool: boolean) => void;
}

export const SignInWithMicrosoftButton = ({ isDisabled, setLoading }: IProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      if (setLoading) setLoading(true);
      const result = await signInWithMicrosoft();
      const firebaseUser = result.user;
      const uid = firebaseUser?.uid;
      if (uid) router.push(getRedirectUri(router.query.redirectUri as string));
    } catch (error) {
      errorToast({ message: getFirebaseErrorMessage(error as FirebaseError) });
    } finally {
      setIsLoading(false);
      if (setLoading) setLoading(false);
    }
  };

  return <SignInButton name={AuthButton.MICROSOFT} onClick={onClick} isLoading={isLoading} isDisabled={isDisabled} />;
};
