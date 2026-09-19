import {
  BooksIcon,
  CalendarBlankIcon,
  FileTextIcon,
  FolderIcon,
  type Icon,
  StudentIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';

interface IStat {
  label: string;
  value: number;
  /** A second line under the label: "3 published", say. */
  detail?: string;
  href: string;
  icon: Icon;
}

interface IProps {
  studentCount: number;
  batchCount: number;
  courseCount: number;
  testPaperCount: number;
  publishedTestPaperCount: number;
  materialCount: number;
  weekSessionCount: number;
}

/**
 * The counts at the top of the home page. Every number is already in a store for the sections
 * below, so this adds no fetching — it answers "how much do I have, and where is it" in one row.
 */
export const WorkspaceSummary = ({
  studentCount,
  batchCount,
  courseCount,
  testPaperCount,
  publishedTestPaperCount,
  materialCount,
  weekSessionCount,
}: IProps) => {
  const stats: IStat[] = [
    { label: 'Students', value: studentCount, href: '/students', icon: StudentIcon },
    { label: 'Batches', value: batchCount, href: '/batches', icon: UsersThreeIcon },
    { label: 'Sessions this week', value: weekSessionCount, href: '/sessions', icon: CalendarBlankIcon },
    { label: 'Courses', value: courseCount, href: '/courses', icon: BooksIcon },
    {
      label: 'Test papers',
      value: testPaperCount,
      detail: testPaperCount ? `${publishedTestPaperCount} published` : undefined,
      href: '/test-papers',
      icon: FileTextIcon,
    },
    { label: 'Study materials', value: materialCount, href: '/study-materials', icon: FolderIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <stat.icon weight="bold" className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-xl font-semibold leading-6 text-foreground">{stat.value}</span>
            <span className="block text-xs leading-4 text-muted-foreground">{stat.label}</span>
            {stat.detail ? <span className="block truncate text-xxs text-muted-foreground">{stat.detail}</span> : null}
          </span>
        </Link>
      ))}
    </div>
  );
};
