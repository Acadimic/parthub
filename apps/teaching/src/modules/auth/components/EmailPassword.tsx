import { Button, TextInput } from '@components/app';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { ILoginUser } from '@interfaces';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSetState } from 'react-use';

interface IProps {
  isLoading: boolean;
  isDisabled: boolean;
  handleSubmit: (state: ILoginUser) => void;
  text: string;
}

export const EmailPassword = ({ isDisabled, isLoading, handleSubmit, text }: IProps) => {
  const { push } = useRouter();
  const [isShowPassword, setIsShowPassword] = useState(false);

  const [state, setState] = useSetState<ILoginUser>({
    email: '',
    password: '',
  });

  const togglePassword = () => {
    setIsShowPassword(!isShowPassword);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState({ [name]: value });
  };

  return (
    <div className={`px-2 md:px-4 py-2 min-w-[300px]`}>
      {/* <h1 className="pb-6 lg:pb-4 text-center font-medium text-2xl lg:text-2xl text-color-primary">Welcome Back 👋</h1> */}
      <div>
        {/* <Link className="flex items-center space-x-1.5 text-blue-primary font-medium text-sm mb-3 md:my-6" href={'/'}>
          <ArrowCircleLeft className="h-5 w-5" />
          <span>Go Back</span>
        </Link> */}
        <div>
          <div className="flex flex-col gap-y-3">
            <TextInput
              label="Email"
              name="email"
              value={state.email}
              placeholder="user@example.com"
              onChange={handleInputChange}
              disabled={isDisabled}
            />
            <TextInput
              type={isShowPassword ? 'text' : 'password'}
              label="Password"
              name="password"
              placeholder="Enter password"
              rightsection={
                <div className="" onClick={togglePassword}>
                  {isShowPassword ? (
                    <EyeSlash weight="thin" className="text-[#929499]" />
                  ) : (
                    <Eye weight="thin" className="text-[#929499]" />
                  )}
                </div>
              }
              onChange={handleInputChange}
              value={state.password}
              disabled={isDisabled}
            />
          </div>

          <div className="flex justify-end text-sm font-medium pt-3">
            <div
              className="cursor-pointer text-blue-primary hover:underline hover:decoration-blue-primary"
              onClick={() => push('/forgot-password')}
            >
              Forgot Password?
            </div>
          </div>
          <div className="pt-4 flex justify-center">
            <Button
              isLoading={isLoading}
              text={text}
              type="submit"
              disabled={isDisabled}
              onClick={() => handleSubmit(state)}
              isFull
            />
          </div>
        </div>
      </div>
    </div>
  );
};
