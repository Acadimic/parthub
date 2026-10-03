import { AuthHeader } from '@components/app/headers';
import { BannerImg } from '@components/images';

interface IProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: IProps) => {
  return (
    <>
      <div className={`bg-muted relative`}>
        <div className="fixed top-0 z-40 w-full">
          <AuthHeader />
        </div>
        <div className="overflow-auto h-[100dvh]">
          <div className="md:h-[90vh] mt-14 sm:mt-16 relative">
            <BannerImg />
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
