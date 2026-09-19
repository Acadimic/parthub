import { BooksIcon, CalendarPlusIcon, FilePlusIcon, FolderPlusIcon } from '@phosphor-icons/react';
import { Link } from '@repo/ui/app';
import { getFormattedDate } from '@utils/helpers';

interface IProps {
  firstName?: string;
  /** How many sessions are on today, for the one line that changes day to day. */
  todayCount: number;
}

const greet = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const todayLine = (count: number) => {
  if (count === 0) return 'Nothing is scheduled today.';
  return `You have ${count} ${count === 1 ? 'session' : 'sessions'} today.`;
};

const ACTIONS = [
  { label: 'Schedule a session', href: '/calender?add=true', icon: CalendarPlusIcon },
  { label: 'Create a test paper', href: '/test-papers?add=true', icon: FilePlusIcon },
  { label: 'Add study material', href: '/study-materials?add=true', icon: FolderPlusIcon },
  { label: 'Add a course', href: '/courses?add=true', icon: BooksIcon },
];

/**
 * The top of the home page: who it is, what today looks like, and the four things a teacher most
 * often comes here to do. Each action deep-links to its page with the create drawer already open.
 */
export const WorkspaceHero = ({ firstName, todayCount }: IProps) => (
  <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-6 sm:px-8 sm:py-8">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
    />
    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">
          {getFormattedDate(new Date(), 'dddd, D MMMM YYYY')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {greet()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {todayLine(todayCount)} Here is your workspace at a glance.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {ACTIONS.map(({ label, href, icon: ActionIcon }) => (
          <Link
            key={href}
            href={href}
            isSecondary
            className="justify-start gap-2 px-3 py-2 text-sm sm:justify-center"
            leftsection={<ActionIcon weight="bold" className="h-4 w-4 text-primary" />}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  </section>
);
