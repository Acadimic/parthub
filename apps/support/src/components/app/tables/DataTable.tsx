import { BlankState } from '@components/others';
import { type IColumnData } from '@interfaces';
import { ACTIONS } from '@utils/constants';
import * as React from 'react';
import { type TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Menu, Tooltip } from '@repo/ui/app';

const DEFAULT_CELL_WIDTH = 180;
/** Shown instead of a blank cell, so a row with no value reads as empty rather than broken. */
const EMPTY_VALUE = '—';

const VirtuosoTableComponents: TableComponents<Record<string, unknown>> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <div {...props} ref={ref} className="!bg-background overflow-auto" />
  )),
  Table: (props) => <table {...props} className="border-collapse w-full table-fixed text-sm" />,
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => <thead {...props} ref={ref} />),
  // The group is named because `Tooltip` keys its own reveal off a bare `group`: an unnamed one here
  // would make every cell in a hovered row pop its tooltip at once. It exists so the sticky actions
  // cell can follow the row hover — it paints its own background to cover the columns sliding under
  // it, so it cannot simply inherit the row's.
  TableRow: (props) => <tr {...props} className="group/row hover:bg-accent" />,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => <tbody {...props} ref={ref} />),
};

interface IProps<T extends object> {
  rows: T[];
  columns: IColumnData<T>[];
  /**
   * Shown in place of the rows when there are none. Worth passing whenever a filter is active: the
   * default reads "Nothing here yet", which is wrong — and misleading — when the collection is full
   * and the search simply matched nothing.
   */
  emptyState?: React.ReactNode;
}

export const DataTable = <T extends object>({ rows, columns, emptyState }: IProps<T>) => {
  const fixedHeaderContent = () => {
    return (
      <tr>
        {columns.map((column) => {
          const isAction = column.dataKey === ACTIONS;
          return (
            <th
              key={column.dataKey}
              align="left"
              style={{ width: column.width || DEFAULT_CELL_WIDTH }}
              className={`bg-background truncate border-b border-border px-4 py-3 text-xxs font-semibold uppercase tracking-caps text-muted-foreground ${
                isAction ? 'sticky right-0 z-10 text-center' : ''
              }`}
            >
              {column.label}
            </th>
          );
        })}
      </tr>
    );
  };

  const rowContent = (_index: number, row: T) => {
    return (
      <React.Fragment>
        {columns.map((column) => {
          const { dataKey, menuItems, width, component } = column;
          const isAction = dataKey === ACTIONS;
          const title = column.tooltipTitle ? column.tooltipTitle(row) : '';
          const rawValue = (row as Record<string, unknown>)[dataKey] as React.ReactNode;
          const formattedValue = column.valueFormatter ? column.valueFormatter(row) : rawValue;
          const { color, bg } = column.getColor ? column.getColor(row) : { color: 'inherit', bg: 'inherit' };
          const isEmpty = formattedValue === null || formattedValue === undefined || formattedValue === '';
          let cell: React.ReactNode;
          if (isAction) {
            cell = <Menu menuItems={menuItems ?? []} data={row} />;
          } else if (component) {
            cell = component(row);
          } else if (isEmpty) {
            cell = <span className="text-muted-foreground">{EMPTY_VALUE}</span>;
          } else if (column.tooltipTitle) {
            cell = (
              <Tooltip title={title}>
                <div className="truncate">{formattedValue}</div>
              </Tooltip>
            );
          } else {
            // The native title carries the full value for a truncated cell, and stays out of the way
            // when the text already fits.
            const fullValue =
              typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : undefined;
            cell = (
              <div className="truncate" title={fullValue}>
                {formattedValue}
              </div>
            );
          }
          return (
            <td
              key={dataKey}
              align="left"
              style={{ width: width || DEFAULT_CELL_WIDTH, background: bg, color }}
              className={`truncate border-b border-border px-4 py-3 align-middle ${
                isAction ? 'sticky right-0 bg-background group-hover/row:bg-accent' : ''
              }`}
            >
              {cell}
            </td>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="shadow-none border h-[calc(100vh-140px)] sm:h-[calc(100vh-148px)] w-full overflow-auto border-border rounded-sm">
      {rows.length ? (
        <TableVirtuoso
          data={rows as Record<string, unknown>[]}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={(index, row) => rowContent(index, row as T)}
          className="w-full"
        />
      ) : (
        <div className="h-full flex items-center justify-center">{emptyState ?? <BlankState />}</div>
      )}
    </div>
  );
};
