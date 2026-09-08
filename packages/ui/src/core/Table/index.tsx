import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { cn } from '../../lib/cn';
import * as React from 'react';

export interface IColumnData<T = unknown> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface ITableProps<T = unknown> {
  columns: IColumnData<T>[];
  rows: T[];
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

export const Table = <T extends Record<string, unknown>>({
  columns,
  rows,
  className,
  onRowClick,
  emptyMessage = 'No data found',
}: ITableProps<T>) => {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <ShadcnTable>
        <TableHeader>
          <TableRow className="border-color-border bg-background-secondary">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn('text-xs font-semibold text-color-secondary', col.className)}
                style={{ width: col.width }}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-color-secondary py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={cn('border-color-border', onRowClick && 'cursor-pointer hover:bg-background-secondary')}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn('text-sm', col.className)}>
                    {col.render ? col.render(row, rowIndex) : (row[col.key] as React.ReactNode)}
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
