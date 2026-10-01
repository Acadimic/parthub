import { cn } from '@repo/ui/lib';
import { type ReactNode } from 'react';

export interface ITooltipRow {
  label: string;
  value: ReactNode;
  /** A swatch class in the series colour, so the row is keyed to its mark. */
  swatchClassName?: string;
}

interface IProps {
  title: ReactNode;
  rows: ITooltipRow[];
}

/** The readout over a hovered mark: a title, then each value with its label after it. */
export const ChartTooltip = ({ title, rows }: IProps) => (
  <div className="min-w-[10rem] rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
    <div className="mb-1.5 text-xs font-semibold">{title}</div>
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {row.swatchClassName ? (
              <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-sm', row.swatchClassName)} />
            ) : null}
            {row.label}
          </span>
          <span className="font-mono font-semibold text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  </div>
);
