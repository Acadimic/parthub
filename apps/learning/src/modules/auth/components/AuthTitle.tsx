import { Logo } from '@parthhub/ui/app';
import { HeaderTitle } from './HeaderTitle';

interface IProps {
  text: string;
}

export const AuthTitle = ({ text }: IProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <Logo className="h-9" />
      </div>
      <HeaderTitle text={text} />
    </div>
  );
};
