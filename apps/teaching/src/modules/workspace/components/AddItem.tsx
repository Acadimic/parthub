import { PlusIcon } from '@phosphor-icons/react';
import Link from 'next/link';

interface IProps {
  /** Label under the plus, e.g. "Add Course". */
  text: string;
  /** Where the tile navigates. */
  href: string;
}

/**
 * The trailing tile in each home-page row. It is a dashed outline rather than a filled card so it
 * reads as an affordance and not as one more piece of content among the real ones.
 */
export const AddItem = ({ text, href }: IProps) => {
  return (
    <Link
      href={href}
      className="group flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 border border-dashed border-border bg-background transition-colors hover:border-primary hover:bg-accent"
    >
      <PlusIcon weight="bold" className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
      <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">{text}</span>
    </Link>
  );
};
