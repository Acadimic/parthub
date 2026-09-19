import { ArrowRightIcon } from '@phosphor-icons/react';
import Link from 'next/link';

interface IProps {
  title: string;
  /** Shown next to the title when there is anything to count. */
  count?: number;
  /** Destination for "View all". Omitted for a section that has no full page behind it. */
  href?: string;
  /** One line under the title. */
  hint?: string;
}

/**
 * A row heading on the home page. Deliberately not the shared `Title`, which centres its text —
 * a dashboard of stacked rows needs headings that scan down one left edge with the row's action
 * parked on the right.
 */
export const SectionHeader = ({ title, count, href, hint }: IProps) => (
  <div className="mb-3 flex items-end justify-between gap-4">
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {count ? (
          <span className="rounded-full bg-muted px-1.5 py-0 font-mono text-xxs font-semibold text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    {href ? (
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        View all
        <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
      </Link>
    ) : null}
  </div>
);
