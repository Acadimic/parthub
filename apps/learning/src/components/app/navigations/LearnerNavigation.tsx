import {
  ChartLineUpIcon,
  CompassIcon,
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
  { name: 'Activity', route: '/activity', icon: ChartLineUpIcon },
];

/** Active for the route itself and anything under it, so `/courses/:id/preview` lights "Courses". */
export const isRouteActive = (current: string, route: string) =>
  route === '/' ? current === '/' : current === route || current.startsWith(`${route}/`);

const TAB_CLASS =
  'flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none';

/** The icon's seat: a small pill tinted behind the active tab and clear otherwise. */
const SEAT_CLASS = 'flex h-6 w-10 items-center justify-center rounded-full transition-colors';

const Tab = ({ nav, isActive }: { nav: INavigation; isActive: boolean }) => (
  <NextLink
    href={nav.route}
    aria-current={isActive ? 'page' : undefined}
    className={cn(TAB_CLASS, isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
  >
    <span className={cn(SEAT_CLASS, isActive && 'bg-primary/10')}>
      <nav.icon weight={isActive ? 'fill' : 'regular'} className="h-[18px] w-[18px]" />
    </span>
    <span className={cn('max-w-full truncate text-xxs leading-none', isActive ? 'font-semibold' : 'font-medium')}>
      {nav.name}
    </span>
  </NextLink>
);

/**
 * The phone's bottom tab bar: a compact pill floating just above the edge, with the four routes
 * and Explore in the middle as a round button, which opens the catalogue sheet rather than a page.
 * The active tab's icon fills and sits in a tinted pill. On wider screens the routes live in the
 * header instead.
 *
 * No `backdrop-blur` here: a filter on a fixed element makes it the containing block for the fixed
 * `Modal`, which then renders inside the bar.
 */
export const LearnerNavigation = () => {
  const { pathname } = useRouter();
  const { isExploreOpen, setIsExploreOpen } = useSelectorLookups();
  const [home, courses, sessions, activity] = learnerRoutes;

  return (
    <div className="pointer-events-auto mx-4 mb-[calc(env(safe-area-inset-bottom)+0.5rem)] rounded-full border border-border/70 bg-background px-2 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.18)]">
      <nav aria-label="Primary" className="flex h-14 items-center">
        <Tab nav={home} isActive={isRouteActive(pathname, home.route)} />
        <Tab nav={courses} isActive={isRouteActive(pathname, courses.route)} />
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label="Explore the catalogue"
            aria-expanded={isExploreOpen}
            onClick={() => setIsExploreOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-5 text-primary-foreground shadow-md shadow-primary/30 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <CompassIcon weight="fill" className="h-5 w-5" />
          </button>
        </div>
        <Tab nav={sessions} isActive={isRouteActive(pathname, sessions.route)} />
        <Tab nav={activity} isActive={isRouteActive(pathname, activity.route)} />
      </nav>
    </div>
  );
};
