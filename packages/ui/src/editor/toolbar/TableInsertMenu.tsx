import { TableIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Popover } from '../../core/Popover';
import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';
import type { ITableInsertOptions } from '../extensions/table';
import { CONTROL_CLASS, keepSelection } from './ToolbarButton';

interface IProps {
  onInsert: (options: ITableInsertOptions) => void;
  /** True while the caret is already in a table: tables do not nest here. */
  isDisabled?: boolean;
}

/** The picker's grid. Larger tables are grown in place with the row and column controls. */
const MAX_ROWS = 8;
const MAX_COLS = 8;

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-primary"
    />
    {label}
  </label>
);

/**
 * Insert a table by pointing at its shape.
 *
 * A grid the author hovers across, the way a word processor does it: the highlighted cells are the
 * table you will get and the caption says its size, so there is no rows/columns form to fill in.
 * The two options that change what kind of table it is — a header row, and borders — sit under
 * the grid and persist for the next insert within the session.
 */
export const TableInsertMenu = ({ onInsert, isDisabled }: IProps) => {
  const [hover, setHover] = useState({ rows: 3, cols: 3 });
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const [bordered, setBordered] = useState(true);

  return (
    <Popover
      className="w-auto p-3"
      trigger={
        <Tooltip title={isDisabled ? 'Tables cannot be placed inside a table' : 'Insert table'}>
          <button
            type="button"
            onMouseDown={keepSelection}
            disabled={isDisabled}
            aria-label="Insert table"
            className={cn(CONTROL_CLASS, 'w-7 text-muted-foreground hover:bg-accent hover:text-foreground')}
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      }
    >
      {({ handleClose }) => (
        <div className="flex flex-col gap-2.5">
          <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
            {hover.rows} × {hover.cols} table
          </p>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1.25rem)` }}
            role="grid"
            aria-label="Table size"
            onMouseLeave={() => setHover({ rows: 3, cols: 3 })}
          >
            {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, index) => {
              const row = Math.floor(index / MAX_COLS) + 1;
              const col = (index % MAX_COLS) + 1;
              const isIn = row <= hover.rows && col <= hover.cols;
              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-label={`${row} by ${col}`}
                  onMouseEnter={() => setHover({ rows: row, cols: col })}
                  onFocus={() => setHover({ rows: row, cols: col })}
                  onClick={() => {
                    onInsert({ rows: row, cols: col, withHeaderRow, bordered });
                    handleClose();
                  }}
                  className={cn(
                    'h-5 w-5 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    isIn ? 'border-primary bg-primary/20' : 'border-border bg-background hover:border-primary/50',
                  )}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5 border-t border-border pt-2">
            <Toggle label="Header row" checked={withHeaderRow} onChange={setWithHeaderRow} />
            <Toggle label="Borders" checked={bordered} onChange={setBordered} />
          </div>
        </div>
      )}
    </Popover>
  );
};
