import { Logo } from '@components/app';
import { HeaderTitle } from './HeaderTitle';

interface IProps {
  text: string;
}

export const AuthTitle = ({ text }: IProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 hidden md:block">
        <Logo className="h-9" />
      </div>
      <HeaderTitle text={text} />
    </div>
  );
};
