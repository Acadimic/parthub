import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { FullLogo, Link, TextInput, ToggleTheme } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useSelectedUser, useSelectorLookups } from '@stores';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isRouteActive, learnerRoutes } from '../navigations';
import { ProfileDropdown } from '../sidebars/components';
import { EXPLORE_SEARCH_ATTRIBUTE, ExploreMenu } from './explore';

interface ISearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitted?: () => void;
}

/**
 * Searches the catalogue: submits to `/courses?q=`, which the grid filters by name and description.
 * Marked as the Explore popover's driver, so a click into it keeps that panel open.
 */
const SearchBar = ({ value, onChange, onSubmitted }: ISearchBarProps) => {
  const { push } = useRouter();

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    const q = value.trim();
    push({ pathname: '/courses', query: q ? { q } : {} });
    onSubmitted?.();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full" {...{ [EXPLORE_SEARCH_ATTRIBUTE]: '' }}>
      <TextInput
        name="q"
        type="search"
        className="[&::-webkit-search-cancel-button]:hidden"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search courses, materials, papers"
        aria-label="Search courses"
        leftsection={<MagnifyingGlassIcon weight="bold" className="h-4 w-4 text-muted-foreground" />}
      />
    </form>
  );
};

/** The primary routes, as text links with an active underline. Account is reached via the avatar. */
/** The learner routes as header links, from `md` up; shared with the auth header so both bars match. */
export const DesktopNav = () => {
  const { pathname } = useRouter();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {learnerRoutes.map((nav) => {
        const isActive = isRouteActive(pathname, nav.route);
        return (
          <NextLink
            key={nav.route}
            href={nav.route}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground lg:px-3',
              isActive ? 'text-primary' : 'text-muted-foreground',
              isActive &&
                'after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-0.5 after:bg-primary lg:after:inset-x-3',
            )}
          >
            {nav.name}
          </NextLink>
        );
      })}
    </nav>
  );
};

/**
 * The top bar on every learner page. Three widths: a phone gets the logo, a search icon that
 * opens the Explore sheet, the theme and the account; a tablet adds the routes and the Explore
 * popover; a wide screen adds the search box, which drives that popover as the learner types.
 *
 * No `backdrop-blur` here: a filter on this fixed element would make it the containing block for
 * the fixed `Modal`, which then renders inside the bar.
 */
export const PageHeader = () => {
  const selectedUser = useSelectedUser();
  const { setIsExploreOpen } = useSelectorLookups();
  const { asPath, query } = useRouter();
  const [isExploreMenuOpen, setIsExploreMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Closes on navigation rather than on click: the shared `Link` owns its click, so the panel
  // could not otherwise know a link in it was followed.
  useEffect(() => {
    setIsExploreMenuOpen(false);
  }, [asPath]);

  // Keeps the box in step with the address, so a back navigation shows the query it came from.
  useEffect(() => {
    setSearch(typeof query.q === 'string' ? query.q : '');
  }, [query.q]);

  // Typing opens the Explore panel on what has been typed so far; clearing the box closes it.
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsExploreMenuOpen(value.trim().length > 0);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:h-16 md:gap-3 lg:gap-4 lg:px-6">
        <div className="flex shrink-0 items-center">
          <FullLogo className="h-6 md:h-7" />
        </div>
        <div className="hidden h-6 w-px bg-border md:block" />
        <DesktopNav />
        <div className="hidden md:block">
          <ExploreMenu isOpen={isExploreMenuOpen} onOpenChange={setIsExploreMenuOpen} query={search} />
        </div>
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="w-full max-w-md">
            <SearchBar value={search} onChange={handleSearchChange} onSubmitted={() => setIsExploreMenuOpen(false)} />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
          {/* Below the wide layout there is no room for the search box; the icon opens the Explore
              sheet, which carries its own. */}
          <button
            type="button"
            aria-label="Search"
            className="rounded-full p-2 text-foreground hover:bg-accent lg:hidden"
            onClick={() => setIsExploreOpen(true)}
          >
            <MagnifyingGlassIcon weight="bold" className="h-5 w-5" />
          </button>
          {selectedUser ? (
            <ProfileDropdown />
          ) : (
            <>
              <ToggleTheme />
              <div className="hidden lg:block">
                <Link isSubtle className="px-3 py-1.5 text-foreground" href="/sign-up">
                  Sign Up
                </Link>
              </div>
              <Link className="px-3 py-1.5 md:px-4" href="/sign-in">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
