import { BooksIcon, CalendarBlankIcon, FileTextIcon, FolderIcon, type Icon } from '@phosphor-icons/react';
import Link from 'next/link';

interface IStat {
  label: string;
  value: number;
  href: string;
  icon: Icon;
}

interface IProps {
  courseCount: number;
  testPaperCount: number;
  materialCount: number;
  sessionCount: number;
}

/**
 * The counts at the top of the home page. Every number here is already in a store for the rows
 * below, so this adds no fetching — it just answers "how much do I have, and where is it" before
 * the teacher scrolls through four carousels to work it out.
 */
export const WorkspaceSummary = ({ courseCount, testPaperCount, materialCount, sessionCount }: IProps) => {
  const stats: IStat[] = [
    { label: "Today's sessions", value: sessionCount, href: '/sessions', icon: CalendarBlankIcon },
    { label: 'Courses', value: courseCount, href: '/courses', icon: BooksIcon },
    { label: 'Test papers', value: testPaperCount, href: '/test-papers', icon: FileTextIcon },
    { label: 'Study materials', value: materialCount, href: '/study-materials', icon: FolderIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="flex items-center gap-3 border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-accent"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted">
            <stat.icon weight="bold" className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-semibold leading-tight">{stat.value}</span>
            <span className="block truncate text-xs text-muted-foreground">{stat.label}</span>
          </span>
        </Link>
      ))}
    </div>
  );
};
