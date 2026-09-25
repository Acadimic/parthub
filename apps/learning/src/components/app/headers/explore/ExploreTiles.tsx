import { cn } from '@repo/ui/lib';
import { GraduationCapIcon } from '@phosphor-icons/react';
import { type ICourse, useStandardLookups } from '@stores';
import { getPlural } from '@utils/helpers';
import { LogoTile } from '../../attachments';

const ROW_CLASS =
  'group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface ITileProps {
  name: string;
  logo?: string | null;
  /** Published courses under this row; hidden when there are none loaded. */
  count: number;
  onClick: () => void;
}

/** One standard or subject: its logo, its name, and how many courses it carries. */
export const Tile = ({ name, logo, count, onClick }: ITileProps) => (
  <button type="button" onClick={onClick} className={ROW_CLASS}>
    <LogoTile url={logo} name={name} size="md" />
    <span className="min-w-0">
      <span className="block truncate text-sm font-medium group-hover:text-primary">{name}</span>
      {count ? (
        <span className="block text-xs text-muted-foreground">
          {count} {getPlural(count, 'course')}
        </span>
      ) : null}
    </span>
  </button>
);

/** A matching course, named with the standard it belongs to. */
export const CourseRow = ({ course, onClick }: { course: ICourse; onClick: () => void }) => {
  const { getStandardsByIds } = useStandardLookups();
  const standardNames = getStandardsByIds(course.standards ?? [])
    .map((standard) => standard.name)
    .join(', ');
  return (
    <button type="button" onClick={onClick} className={ROW_CLASS}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <GraduationCapIcon weight="bold" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium group-hover:text-primary">{course.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{standardNames || course.description}</span>
      </span>
    </button>
  );
};

export const Heading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('px-2 pb-2 text-xs font-semibold uppercase tracking-caps text-muted-foreground', className)}>
    {children}
  </div>
);
