import {
  BooksIcon,
  GraduationCapIcon,
  type Icon,
  ImageBrokenIcon,
  LinkSimpleIcon,
  SquaresFourIcon,
  TrayIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';

interface IStat {
  label: string;
  value: number;
  /** A second line under the label. */
  detail?: string;
  href: string;
  icon: Icon;
  /** A count that should be zero: drawn in the warning tone while it is not. */
  isIssue?: boolean;
}

interface IProps {
  standardCount: number;
  groupCount: number;
  subjectCount: number;
  mappingCount: number;
  missingLogoCount: number;
  unmappedSubjectCount: number;
}

/**
 * The counts at the top of the home page. Every number is already in the store for the sections
 * below, so this adds no fetching — it answers "how big is the catalogue, and what needs a hand".
 */
export const CatalogueSummary = ({
  standardCount,
  groupCount,
  subjectCount,
  mappingCount,
  missingLogoCount,
  unmappedSubjectCount,
}: IProps) => {
  const stats: IStat[] = [
    {
      label: 'Standards',
      value: standardCount,
      detail: groupCount ? `in ${groupCount} ${groupCount === 1 ? 'group' : 'groups'}` : undefined,
      href: '/standards',
      icon: GraduationCapIcon,
    },
    { label: 'Subjects', value: subjectCount, href: '/subjects', icon: BooksIcon },
    { label: 'Mappings', value: mappingCount, detail: 'standard → subject', href: '/standards', icon: LinkSimpleIcon },
    { label: 'Groups in use', value: groupCount, href: '/standards', icon: SquaresFourIcon },
    {
      label: 'Missing logos',
      value: missingLogoCount,
      detail: 'standards and subjects',
      href: '/standards',
      icon: ImageBrokenIcon,
      isIssue: true,
    },
    {
      label: 'Unmapped subjects',
      value: unmappedSubjectCount,
      detail: 'in no standard yet',
      href: '/subjects',
      icon: TrayIcon,
      isIssue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const isFlagged = stat.isIssue && stat.value > 0;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={
                isFlagged
                  ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning'
                  : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'
              }
            >
              <stat.icon weight="bold" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-xl font-semibold leading-6 text-foreground">{stat.value}</span>
              <span className="block text-xs leading-4 text-muted-foreground">{stat.label}</span>
              {stat.detail ? (
                <span className="block truncate text-xxs text-muted-foreground">{stat.detail}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
