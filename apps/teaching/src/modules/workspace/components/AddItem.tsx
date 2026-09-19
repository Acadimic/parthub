import { PlusIcon } from '@phosphor-icons/react';
import Link from 'next/link';

interface IProps {
  /** Label under the plus, e.g. "Add course". */
  text: string;
  /** Where the tile navigates. */
  href: string;
}

/**
 * The trailing tile in each home-page row. A dashed outline rather than a filled card, so it reads
 * as an affordance and not as one more piece of content among the real ones.
 */
export const AddItem = ({ text, href }: IProps) => (
  <Link
    href={href}
    className="group flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
      <PlusIcon weight="bold" className="h-5 w-5" />
    </span>
    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">{text}</span>
  </Link>
);
