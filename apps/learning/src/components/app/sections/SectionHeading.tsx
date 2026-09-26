import { Link } from '@repo/ui/app';
import { ArrowRightIcon } from '@phosphor-icons/react';

interface IProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** A link to the fuller page, shown at the right on wide screens and under the copy on phones. */
  action: { label: string; href: string } | null;
}

/** The title block every home section opens with. */
export const SectionHeading = ({ eyebrow, title, subtitle, action }: IProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      <div className="mb-2 text-xs font-semibold uppercase tracking-caps text-primary">{eyebrow}</div>
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
    {action ? (
      <Link
        href={action.href}
        isSubtle
        className="w-fit px-2 py-1 text-sm text-primary"
        rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
      >
        {action.label}
      </Link>
    ) : null}
  </div>
);
