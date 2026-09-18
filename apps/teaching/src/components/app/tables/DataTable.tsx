import { BlankState } from '@components/others';
import { type IColumnData } from '@interfaces';
import { ACTIONS } from '@utils/constants';
import * as React from 'react';
import { type TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Menu, RectangleSkeleton, Tooltip } from '@repo/ui/app';

const DEFAULT_CELL_WIDTH = 180;
/** Shown instead of a blank cell, so a row with no value reads as empty rather than broken. */
const EMPTY_VALUE = '—';
/** Enough placeholder rows to fill the frame's first fold without pretending to know the count. */
const SKELETON_ROW_COUNT = 8;

/** What the row component needs from the table and cannot get from its props: the click handler. */
interface ITableContext {
  onRowClick?: (row: Record<string, unknown>) => void;
}

const VirtuosoTableComponents: TableComponents<Record<string, unknown>, ITableContext> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <div {...props} ref={ref} className="!bg-background overflow-auto" />
  )),
  Table: (props) => <table {...props} className="w-full table-fixed border-collapse text-sm" />,
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => <thead {...props} ref={ref} />),
  // The group is named because `Tooltip` keys its own reveal off a bare `group`: an unnamed one here
  // would make every cell in a hovered row pop its tooltip at once. It exists so the sticky actions
  // cell can follow the row hover — it paints its own background to cover the columns sliding under
  // it, so it cannot simply inherit the row's.
  TableRow: ({ item, context, ...props }) => (
    <tr
      {...props}
      className={`group/row transition-colors hover:bg-accent ${context?.onRowClick ? 'cursor-pointer' : ''}`}
      onClick={context?.onRowClick ? () => context.onRowClick?.(item) : undefined}
    />
  ),
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
  /** Renders placeholder rows under the real header while the first page is on its way. */
  isLoading?: boolean;
  /**
   * Makes the whole row a target. Cells that carry their own control (the actions menu, a link)
   * stop the event, so a click there does not also open the row.
   */
  onRowClick?: (row: T) => void;
}

/** Lets a click on a link, button or menu inside a cell stay with that control instead of the row. */
const stopRowClickFromControls = (event: React.MouseEvent<HTMLTableCellElement>) => {
  if ((event.target as HTMLElement).closest('a, button, [role="button"], [role="menu"]')) event.stopPropagation();
};

const headerClass = (isAction: boolean) =>
  `truncate border-b border-border bg-muted px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-caps text-muted-foreground ${
    isAction ? 'sticky right-0 z-10 text-center' : ''
  }`;

export const DataTable = <T extends object>({ rows, columns, emptyState, isLoading, onRowClick }: IProps<T>) => {
  const fixedHeaderContent = () => {
    return (
      <tr>
        {columns.map((column) => {
          const isAction = column.dataKey === ACTIONS;
          return (
            <th
              key={column.dataKey}
              style={{ width: column.width || DEFAULT_CELL_WIDTH }}
              className={headerClass(isAction)}
              title={column.label}
            >
              {column.label}
            </th>
          );
        })}
      </tr>
    );
  };

  /** What goes inside one cell: the actions menu, a custom component, an empty mark, or the value. */
  const renderCell = (column: IColumnData<T>, row: T): React.ReactNode => {
    const { dataKey, menuItems, component } = column;
    if (dataKey === ACTIONS) return <Menu menuItems={menuItems ?? []} data={row} />;
    if (component) return component(row);
    const rawValue = (row as Record<string, unknown>)[dataKey] as React.ReactNode;
    const formattedValue = column.valueFormatter ? column.valueFormatter(row) : rawValue;
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
      return <span className="text-muted-foreground">{EMPTY_VALUE}</span>;
    }
    if (column.tooltipTitle) {
      return (
        <Tooltip title={column.tooltipTitle(row)}>
          <div className="truncate">{formattedValue}</div>
        </Tooltip>
      );
    }
    // The native title carries the full value for a truncated cell, and stays out of the way when
    // the text already fits.
    const fullValue = typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : undefined;
    return (
      <div className="truncate" title={fullValue}>
        {formattedValue}
      </div>
    );
  };

  const rowContent = (_index: number, row: T) => {
    return (
      <React.Fragment>
        {columns.map((column) => {
          const isAction = column.dataKey === ACTIONS;
          const { color, bg } = column.getColor ? column.getColor(row) : { color: 'inherit', bg: 'inherit' };
          return (
            <td
              key={column.dataKey}
              style={{ width: column.width || DEFAULT_CELL_WIDTH, background: bg, color }}
              className={`truncate border-b border-border px-4 py-2.5 align-middle ${
                isAction ? 'sticky right-0 bg-background group-hover/row:bg-accent' : ''
              }`}
              // A control inside the cell is its own target; the row click is for the rest. Without
              // this a name rendered as a link fired both its own navigation and the row's, and two
              // concurrent pushes to one dynamic route made Next fall back to a full page load.
              onClick={onRowClick ? stopRowClickFromControls : undefined}
            >
              {renderCell(column, row)}
            </td>
          );
        })}
      </React.Fragment>
    );
  };

  const renderSkeleton = () => (
    <table className="w-full table-fixed border-collapse text-sm">
      <thead>{fixedHeaderContent()}</thead>
      <tbody>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, columnIndex) => (
              <td
                key={column.dataKey}
                style={{ width: column.width || DEFAULT_CELL_WIDTH }}
                className="border-b border-border px-4 py-3"
              >
                {/* Varied widths so the placeholder reads as text rather than as a grid. */}
                <RectangleSkeleton height={12} width={`${columnIndex === 0 ? 70 : 45 + ((rowIndex * 7) % 30)}%`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderBody = () => {
    if (isLoading) return renderSkeleton();
    if (!rows.length) {
      return <div className="flex h-full items-center justify-center">{emptyState ?? <BlankState />}</div>;
    }
    return (
      <TableVirtuoso
        data={rows as Record<string, unknown>[]}
        context={{ onRowClick: onRowClick as ITableContext['onRowClick'] }}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={(index, row) => rowContent(index, row as T)}
        className="w-full"
      />
    );
  };

  return (
    <div className="h-[calc(100vh-148px)] w-full overflow-hidden rounded-lg border border-border bg-background sm:h-[calc(100vh-156px)]">
      {renderBody()}
    </div>
  );
};
