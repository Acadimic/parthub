import { Button, TextInput, ToggleTheme } from '@repo/ui/app';
import { ArrowCircleLeftIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { HorizontalLineWithText, Policy } from '@components/others';
import { type ILoginUser } from '@interfaces';
import { type FirebaseError, createFirebaseUser, fetchSignInMethods, getFirebaseErrorMessage } from '@utils/firebase';
import { errorToast, getRedirectUri, isValidEmail } from '@utils/helpers';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSetState } from 'react-use';
import { SignInWithGoogleButton, SignInWithMicrosoftButton } from './components';
import { OnboardingBanner } from './OnboardingBanner';

export const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const router = useRouter();

  const [state, setState] = useSetState<ILoginUser>({
    email: '',
    password: '',
  });

  const signUpHandler = async ({ email: rawEmail, password }: ILoginUser) => {
    try {
      const email = rawEmail?.trim()?.toLowerCase();
      const result = await createFirebaseUser({ email, password });
      const firebaseUser = result.user;
      const uid = firebaseUser?.uid;
      if (uid) router.push(getRedirectUri(router.query.redirectUri as string));
    } catch (error) {
      errorToast({ message: getFirebaseErrorMessage(error as FirebaseError) });
    }
  };

  const togglePassword = () => {
    setIsShowPassword(!isShowPassword);
  };

  const handleSubmit = async () => {
    const { email, password } = state;
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
      errorToast({ message: getFirebaseErrorMessage(err as FirebaseError) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState({ [name]: value });
  };

  return (
    <div className="w-full flex h-full">
      <div className="lg:w-[50%] hidden lg:block bg-black">
        <OnboardingBanner />
      </div>
      <div className="w-full lg:w-[50%] relative">
        <div className="absolute -top-16 justify-end items-center w-full px-8 hidden lg:flex h-16">
          <ToggleTheme />
        </div>
        <div className={`mx-auto max-w-xs lg:max-w-md px-2 md:px-4 py-2 md:pt-10`}>
          <h1 className="pb-6 lg:pb-4 text-center font-medium text-2xl lg:text-2xl text-foreground">
            Create an Account
          </h1>
          <div>
            <Link className="flex items-center space-x-1.5 text-primary font-medium text-sm mb-3 md:my-6" href={'/'}>
              <ArrowCircleLeftIcon className="h-5 w-5" />
              <span>Go Back</span>
            </Link>
            <div>
              <div className="flex flex-col gap-y-3">
                <TextInput label="Email" name="email" placeholder="user@example.com" onChange={handleInputChange} />
                <TextInput
                  type={isShowPassword ? 'text' : 'password'}
                  label="Password"
                  name="password"
                  placeholder="Enter password"
                  rightsection={
                    <div className="" onClick={togglePassword}>
                      {isShowPassword ? (
                        <EyeSlashIcon weight="thin" className="text-[#929499]" />
                      ) : (
                        <EyeIcon weight="thin" className="text-[#929499]" />
                      )}
                    </div>
                  }
                  onChange={handleInputChange}
                />
              </div>

              <div
                className="text-right text-primary text-sm font-medium pt-3 cursor-pointer hover:underline hover:decoration-primary"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot Password?
              </div>
              <div className="pt-4 flex justify-center">
                <Button
                  isLoading={isLoading}
                  text="Sign Up"
                  type="submit"
                  disabled={isDisabled}
                  onClick={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-4 px-4 mt-3">
          <div className="w-full md:w-[500px]">
            <HorizontalLineWithText text="or continue with" />
          </div>
          <div className="flex flex-col md:flex-row justify-start gap-3 items-center md:gap-4">
            <div className="flex space-x-3">
              <SignInWithGoogleButton isDisabled={isDisabled} setLoading={setIsDisabled} />
              <SignInWithMicrosoftButton isDisabled={isDisabled} setLoading={setIsDisabled} />
            </div>
          </div>
          <Policy />
        </div>
        <div className="text-sm text-center text-muted-foreground my-4 md:my-6">
          Already have an account?&nbsp;
          <Link
            href="/sign-in"
            className="text-primary font-medium cursor-pointer hover:underline hover:decoration-primary"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
