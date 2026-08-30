import { useRouter } from 'next/router';
import { ToggleTheme } from '.';
import { Link } from '../links';
import { FullLogo } from '../logos';

export const AuthHeader = () => {
  const { pathname } = useRouter();

  return (
    <>
      <div className={`bg-background-primary w-full`}>
        <div className="px-4 md:px-8 py-1.5 border-b border-color-border">
          <div className="flex justify-between items-center h-12">
            <div className="flex justify-start items-center space-x-2">
              {/* <div className="block md:hidden">
                <Logo />
              </div> */}
              <div>
                <FullLogo className="h-6 md:h-7" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ToggleTheme />
              {pathname?.includes('/sign-up') ? (
                <Link isSubtle linkClassName="font-medium text-sm text-color-primary" href="/sign-in">
                  SIGN IN
                </Link>
              ) : (
                <Link isSubtle linkClassName="font-medium text-sm text-color-primary" href="/sign-up">
                  SIGN UP
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
