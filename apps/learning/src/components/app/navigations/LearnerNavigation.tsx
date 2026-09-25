import { cn } from '@repo/ui/lib';
import { CompassIcon, GearIcon, HouseIcon, type Icon, PaperPlaneIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { useSelectorLookups } from '@stores';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

interface INavigation {
  name: string;
  route: string;
  icon: Icon;
}

/** Each route needs a page under `src/pages`; `/learning` and `/sessions` had none and answered 404. */
export const learnerRoutes: INavigation[] = [
  { name: 'Home', route: '/', icon: HouseIcon },
  { name: 'Courses', route: '/courses', icon: PaperPlaneIcon },
  { name: 'Sessions', route: '/sessions', icon: VideoCameraIcon },
  { name: 'Account', route: '/account-settings', icon: GearIcon },
];

/** Active for the route itself and anything under it, so `/courses/:id/preview` lights "Courses". */
export const isRouteActive = (current: string, route: string) =>
  route === '/' ? current === '/' : current === route || current.startsWith(`${route}/`);

const TAB_CLASS = 'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-1.5 text-xxs font-medium';

const Tab = ({ nav, isActive }: { nav: INavigation; isActive: boolean }) => (
  <NextLink
    href={nav.route}
    aria-current={isActive ? 'page' : undefined}
    className={cn(TAB_CLASS, isActive ? 'text-primary' : 'text-muted-foreground')}
  >
    <nav.icon weight={isActive ? 'fill' : 'regular'} className="h-5 w-5" />
    <span className="truncate">{nav.name}</span>
  </NextLink>
);

/**
 * The phone's bottom tab bar: the four routes with Explore raised in the middle, which opens the
 * catalogue sheet rather than a page. On wider screens the routes sit in the header instead.
 */
export const LearnerNavigation = () => {
  const { pathname } = useRouter();
  const { isExploreOpen, setIsExploreOpen } = useSelectorLookups();
  const [home, courses, sessions, account] = learnerRoutes;

  return (
    <nav aria-label="Primary" className="flex items-end justify-around">
      <Tab nav={home} isActive={isRouteActive(pathname, home.route)} />
      <Tab nav={courses} isActive={isRouteActive(pathname, courses.route)} />
      <button
        type="button"
        aria-label="Explore the catalogue"
        aria-expanded={isExploreOpen}
        onClick={() => setIsExploreOpen(true)}
        className={cn(TAB_CLASS, 'text-primary')}
      >
        <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
          <CompassIcon weight="fill" className="h-6 w-6" />
        </span>
        <span>Explore</span>
      </button>
      <Tab nav={sessions} isActive={isRouteActive(pathname, sessions.route)} />
      <Tab nav={account} isActive={isRouteActive(pathname, account.route)} />
    </nav>
  );
};
