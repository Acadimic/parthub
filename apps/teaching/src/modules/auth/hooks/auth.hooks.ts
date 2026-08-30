import { ILoginUser } from '@interfaces';
import { createFirebaseUser, fetchSignInMethods, getFirebaseErrorMessage, signIn } from '@utils/firebase';
import { errorToast, getRedirectUri, isValidEmail } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useState } from 'react';

export const useSignInHook = () => {
  const { push, query } = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const loginHandler = async ({ email, password }: ILoginUser) => {
    try {
      email = email?.trim()?.toLowerCase();
      const result = await signIn(email, password);
      const firebaseUser = result.user;
      const uid = firebaseUser?.uid;
      if (uid) push(getRedirectUri(query.redirectUri as string));
    } catch (error: any) {
      errorToast({ message: getFirebaseErrorMessage(error) });
    }
  };

  const handleSignInSubmit = async ({ email, password }: ILoginUser) => {
    try {
      if (!email || !isValidEmail(email)) {
        errorToast({ message: 'Invalid email address.' });
        return;
      }
      if (!password || password.trim().length < 8) {
        errorToast({ message: 'Invalid password. Password length should not be less than 8 chars.' });
        return;
      }
      setIsLoading(true);
      const result = await Promise.all([fetchSignInMethods(email?.trim()?.toLowerCase())]);
      const signInMethods = result[0];
      if (signInMethods.length === 0) {
        errorToast({ message: 'User not found!' });
        return;
      }
      await loginHandler({ email, password });
    } catch (err) {
      errorToast({ message: getFirebaseErrorMessage(err as any) });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSignInSubmit, isLoading };
};

export const useSignUpHook = () => {
  const { push, query } = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signUpHandler = async ({ email, password }: ILoginUser) => {
    try {
      email = email?.trim()?.toLowerCase();
      const result = await createFirebaseUser({ email, password });
      const firebaseUser = result.user;
      const uid = firebaseUser?.uid;
      if (uid) push(getRedirectUri(query.redirectUri as string));
    } catch (error: any) {
      errorToast({ message: getFirebaseErrorMessage(error) });
    }
  };

  const handleSignUpSubmit = async ({ email, password }: ILoginUser) => {
    try {
      if (!email || !isValidEmail(email)) {
        errorToast({ message: 'Invalid email address.' });
        return;
      }
      if (!password || password.trim().length < 8) {
        errorToast({ message: 'Invalid password. Password length should not be less than 8 chars.' });
        return;
      }
      setIsLoading(true);
      const result = await Promise.all([fetchSignInMethods(email?.trim()?.toLowerCase())]);
      const signInMethods = result[0];
      if (signInMethods.length > 0) {
        errorToast({ message: 'User already found. Please login.' });
        return;
      }
      await signUpHandler({ email, password });
    } catch (err) {
      errorToast({ message: getFirebaseErrorMessage(err as any) });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSignUpSubmit, isLoading };
};
