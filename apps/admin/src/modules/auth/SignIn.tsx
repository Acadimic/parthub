/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, TextInput } from '@repo/ui/app';
import { ILoginUser } from '@interfaces';
import { ArrowCircleLeftIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { getFirebaseErrorMessage, signIn } from '@utils/firebase';
import { errorToast, getRedirectUri, isValidEmail } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSetState } from 'react-use';

export const SignIn = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const router = useRouter();

  const [state, setState] = useSetState<ILoginUser>({
    email: '',
    password: '',
  });

  const loginHandler = async ({ email, password }: ILoginUser) => {
    try {
      email = email?.trim()?.toLowerCase();
      const result = await signIn(email, password);
      const firebaseUser = result.user;
      const uid = firebaseUser?.uid;
      if (uid) router.push(getRedirectUri(router.query.redirectUri as string));
    } catch (error: any) {
      errorToast({ message: getFirebaseErrorMessage(error) });
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
      await loginHandler({ email, password });
    } catch (err) {
      errorToast({ message: getFirebaseErrorMessage(err as any) });
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
      <div className="lg:w-[50%] hidden lg:block border-r border-r-color-border"></div>
      <div className="w-full lg:w-[50%]">
        <div className={`mx-auto max-w-xs lg:max-w-md px-2 md:px-4 py-2 md:pt-10`}>
          <h1 className="pb-6 lg:pb-4 text-center font-medium text-2xl lg:text-2xl text-color-primary">
            Welcome Back 👋
          </h1>
          <div>
            <Link
              className="flex items-center space-x-1.5 text-blue-primary font-medium text-sm mb-3 md:my-6"
              href={'/'}
            >
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
              <div className="pt-4 flex justify-center">
                <Button isLoading={isLoading} text="Sign In" type="submit" onClick={handleSubmit} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
