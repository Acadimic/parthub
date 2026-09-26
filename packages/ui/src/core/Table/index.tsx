import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { cn } from '../../lib/cn';
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import * as React from 'react';

export interface IColumnData<T = unknown> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  /** Show a sort toggle in the header. Rows sort by `sortValue`, or by the raw field when absent. */
  isSortable?: boolean;
  sortValue?: (row: T) => string | number;
}

interface ITableProps<T = unknown> {
  columns: IColumnData<T>[];
  rows: T[];
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

type Direction = 'asc' | 'desc';

interface ISort {
  key: string;
  direction: Direction;
}

const getSortValue = <T extends object>(row: T, column: IColumnData<T>) =>
  column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key];

const compare = (a: unknown, b: unknown) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
};

const getAriaSort = (sort: ISort | null, key: string) => {
  if (sort?.key !== key) return undefined;
  return sort.direction === 'asc' ? 'ascending' : 'descending';
};

const SortIcon = ({ direction }: { direction: Direction | null }) => {
  if (direction === 'asc') return <CaretUpIcon weight="bold" className="h-3 w-3" />;
  if (direction === 'desc') return <CaretDownIcon weight="bold" className="h-3 w-3" />;
  return <CaretUpDownIcon weight="bold" className="h-3 w-3 opacity-50" />;
};

export const Table = <T extends object>({
  columns,
  rows,
  className,
  onRowClick,
  emptyMessage = 'No data found',
}: ITableProps<T>) => {
  const [sort, setSort] = React.useState<ISort | null>(null);

  const toggleSort = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const sortedColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const sortedRows =
    sort && sortedColumn
      ? [...rows].sort((a, b) => {
          const order = compare(getSortValue(a, sortedColumn), getSortValue(b, sortedColumn));
          return sort.direction === 'asc' ? order : -order;
        })
      : rows;

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <ShadcnTable>
        <TableHeader>
          <TableRow className="border-border bg-muted">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                aria-sort={getAriaSort(sort, col.key)}
                className={cn('text-xs font-semibold text-muted-foreground', col.className)}
                style={{ width: col.width }}
              >
                {col.isSortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground"
                  >
                    {col.label}
                    <SortIcon direction={sort?.key === col.key ? sort.direction : null} />
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedRows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={cn('border-border', onRowClick && 'cursor-pointer hover:bg-accent')}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn('text-sm', col.className)}>
                    {col.render
                      ? col.render(row, rowIndex)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  );
};

export type { ITableProps };
