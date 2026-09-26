import {
  ChartLineUpIcon,
  CompassIcon,
  GearIcon,
  HouseIcon,
  type Icon,
  PaperPlaneIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
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

/** The learner's own record. In the header and the account menu, not the phone's tab bar. */
export const activityRoute: INavigation = { name: 'Activity', route: '/activity', icon: ChartLineUpIcon };

/** Active for the route itself and anything under it, so `/courses/:id/preview` lights "Courses". */
export const isRouteActive = (current: string, route: string) =>
  route === '/' ? current === '/' : current === route || current.startsWith(`${route}/`);

const TAB_CLASS =
  'flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-xxs font-medium transition-colors focus-visible:outline-none';

/** The icon's seat: a soft pill that fills in behind the active tab and stays clear otherwise. */
const SEAT_CLASS = 'flex h-7 w-12 items-center justify-center rounded-full transition-colors';

const Tab = ({ nav, isActive }: { nav: INavigation; isActive: boolean }) => (
  <NextLink
    href={nav.route}
    aria-current={isActive ? 'page' : undefined}
    className={cn(TAB_CLASS, isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
  >
    <span className={cn(SEAT_CLASS, isActive && 'bg-primary/10')}>
      <nav.icon weight={isActive ? 'fill' : 'regular'} className="h-5 w-5" />
    </span>
    <span className="truncate text-sm">{nav.name}</span>
  </NextLink>
);

/**
 * The phone's bottom tab bar, floating just above the edge: the four routes with Explore raised in
 * the middle, which opens the catalogue sheet rather than a page. The active tab's icon sits in a
 * tinted pill. On wider screens the routes live in the header instead.
 *
 * No `backdrop-blur` here: a filter on a fixed element makes it the containing block for the fixed
 * `Modal`, which then renders inside the bar.
 */
export const LearnerNavigation = () => {
  const { pathname } = useRouter();
  const { isExploreOpen, setIsExploreOpen } = useSelectorLookups();
  const [home, courses, sessions, account] = learnerRoutes;

  return (
    <div className="pointer-events-auto mx-3 mb-[calc(env(safe-area-inset-bottom)+0.75rem)] rounded-2xl border border-border bg-background px-1 shadow-lg">
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
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background transition-transform active:scale-95">
            <CompassIcon weight="fill" className="h-6 w-6" />
          </span>
          <span>Explore</span>
        </button>
        <Tab nav={sessions} isActive={isRouteActive(pathname, sessions.route)} />
        {/* Activity is reached from the account screen on a phone, so it counts as Account here. */}
        <Tab
          nav={account}
          isActive={isRouteActive(pathname, account.route) || isRouteActive(pathname, activityRoute.route)}
        />
      </nav>
    </div>
  );
};
