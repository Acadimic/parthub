import { type Icon } from '@phosphor-icons/react';

interface IProps {
  icon: Icon;
  value: string | number;
  label: string;
}

/** One number in a stats strip: an icon, the figure in tabular digits, and what it counts. */
export const StatTile = ({ icon: TileIcon, value, label }: IProps) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-primary">
      <TileIcon className="h-5 w-5" />
    </span>
    <span className="min-w-0">
      <span className="block truncate font-mono text-lg font-semibold leading-6 text-foreground">{value}</span>
      <span className="block truncate text-xs text-muted-foreground">{label}</span>
    </span>
  </div>
);
