import { FullLogo, Link, ToggleTheme } from '@repo/ui/app';
import { useRouter } from 'next/router';
import { DesktopNav } from './PageHeader';

/**
 * The bar over the sign-in and sign-up screens: the page header's shell, logo and routes, with
 * the one action that makes sense here — the other half of the pair — where the account sits.
 */
export const AuthHeader = () => {
  const { pathname } = useRouter();
  const isSignUp = pathname.includes('/sign-up');

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:h-16 md:gap-3 lg:gap-4 lg:px-6">
        <div className="flex shrink-0 items-center">
          <FullLogo className="h-6 md:h-7" />
        </div>
        <div className="hidden h-6 w-px bg-border md:block" />
        <DesktopNav />
        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-4">
          <ToggleTheme />
          {/* The hint and its button read as one phrase, so they sit closer to each other than to the toggle. */}
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground lg:block">
              {isSignUp ? 'Already have an account?' : 'New here?'}
            </span>
            <Link className="px-4 py-2" href={isSignUp ? '/sign-in' : '/sign-up'}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
