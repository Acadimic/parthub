import { AuthHeader } from '@components/app/headers';
import { BannerImg } from '@components/images';

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
        <div className="overflow-auto h-screen">
          <div className="md:h-[90vh] mt-16 sm:mt-16 relative">
            <BannerImg />
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
