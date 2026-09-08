import { AuthHeader } from '@components/app/headers';

interface IProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: IProps) => {
  return (
    <>
      <div className={`bg-background-secondary relative`}>
        <div className="fixed top-0 z-10 w-full">
          <AuthHeader />
        </div>
        <div className="overflow-auto h-[100vh]">
          <div className="h-screen pt-24 lg:pt-16">{children}</div>
        </div>
      </div>
    </>
  );
};
