import { BooksIcon, GraduationCapIcon } from '@phosphor-icons/react';
import { getFormattedDate } from '@repo/ui/lib';
import Link from 'next/link';

interface IProps {
  firstName?: string;
}

const greet = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const ACTIONS = [
  { label: 'Add a standard', href: '/standards?add=true', icon: GraduationCapIcon },
  { label: 'Add a subject', href: '/subjects?add=true', icon: BooksIcon },
];

/**
 * The top of the support home: what this app is for and the two things it is opened to do. Each
 * action deep-links to its list with the create drawer already open.
 */
export const CatalogueHero = ({ firstName }: IProps) => (
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
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          The platform catalogue: the standards, subjects and mappings every organisation on Acadimic teaches against.
          Changes here reach the teaching and learning apps on their next load.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {ACTIONS.map(({ label, href, icon: ActionIcon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:justify-center"
          >
            <ActionIcon weight="bold" className="h-4 w-4 text-primary" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  </section>
);
