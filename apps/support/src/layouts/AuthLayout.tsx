import { AuthHeader } from '@components/app/headers';

interface IProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: IProps) => {
  return (
    <>
      <div className={`bg-muted relative`}>
        <div className="fixed top-0 z-10 w-full">
          <AuthHeader />
        </div>
        <div className="overflow-auto h-[100vh] px-8">
          <div className="pt-20">{children}</div>
        </div>
      </div>
    </>
  );
};
