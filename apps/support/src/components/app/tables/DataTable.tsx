import { BlankState } from '@components/others';
import { type ColumnAlign, type IColumnData, type IColumnFilter, type ISelectItem } from '@interfaces';
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon, FunnelSimpleIcon, XIcon } from '@phosphor-icons/react';
import { Button, Menu, RectangleSkeleton, Tooltip } from '@repo/ui/app';
import { Checkbox, Popover } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { ACTIONS } from '@utils/constants';
import * as React from 'react';
import { type TableComponents, TableVirtuoso } from 'react-virtuoso';

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
  /** Overrides the frame — its height, most often, when the toolbar above the table is taller than usual. */
  className?: string;
}

type SortDirection = 'asc' | 'desc';

interface ISort {
  dataKey: string;
  direction: SortDirection;
}

/** Numbers by value, strings by locale, and a missing value after everything else whichever way the sort runs. */
const compareValues = (a: unknown, b: unknown): number => {
  const aMissing = a === null || a === undefined || a === '';
  const bMissing = b === null || b === undefined || b === '';
  if (aMissing || bMissing) return Number(aMissing) - Number(bMissing);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

/** The ticked values per filter key. A key that is absent or empty leaves that filter open. */
type ActiveFilters = Record<string, string[]>;

const toFilterValues = (value: ReturnType<IColumnFilter['getValues']>): string[] => {
  const list = Array.isArray(value) ? value : [value];
  return list.filter((item) => item !== null && item !== undefined && item !== '').map(String);
};

/** Whether a row has at least one of the ticked values; an untouched filter lets every row through. */
const rowPassesFilter = <T,>(row: T, filter: IColumnFilter<T>, ticked: string[] | undefined) =>
  !ticked?.length || toFilterValues(filter.getValues(row)).some((value) => ticked.includes(value));

/** The options a filter offers: its own list, or the distinct values the rows hold, sorted. */
const optionsFor = <T,>(filter: IColumnFilter<T>, rows: T[]): ISelectItem[] => {
  if (filter.options) return filter.options;
  const seen = new Set<string>();
  rows.forEach((row) => toFilterValues(filter.getValues(row)).forEach((value) => seen.add(value)));
  return [...seen]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((value) => ({ label: value, value }));
};

const ARIA_SORT: Record<SortDirection, 'ascending' | 'descending'> = { asc: 'ascending', desc: 'descending' };
const ALIGN_CLASS: Record<ColumnAlign, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };
const JUSTIFY_CLASS: Record<ColumnAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

/** Lets a click on a link, button or menu inside a cell stay with that control instead of the row. */
const stopRowClickFromControls = (event: React.MouseEvent<HTMLTableCellElement>) => {
  if ((event.target as HTMLElement).closest('a, button, [role="button"], [role="menu"]')) event.stopPropagation();
};

const headerClass = (isAction: boolean, align: ColumnAlign) =>
  cn(
    'truncate border-b border-border bg-muted px-3 py-2.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground',
    isAction ? 'sticky right-0 z-10 text-center' : ALIGN_CLASS[align],
  );

const SortIcon = ({ direction }: { direction?: SortDirection }) => {
  if (direction === 'asc') return <CaretUpIcon weight="bold" className="h-3 w-3 text-foreground" />;
  if (direction === 'desc') return <CaretDownIcon weight="bold" className="h-3 w-3 text-foreground" />;
  return <CaretUpDownIcon weight="bold" className="h-3 w-3 opacity-50" />;
};

/** A header label that sorts on click and shows which way the rows currently run. */
const SortButton = ({
  label,
  align,
  direction,
  onClick,
}: {
  label: string;
  align: ColumnAlign;
  direction?: SortDirection;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex min-w-0 flex-1 items-center gap-1 uppercase tracking-caps transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      JUSTIFY_CLASS[align],
      direction && 'text-foreground',
    )}
  >
    <span className="truncate">{label}</span>
    <SortIcon direction={direction} />
  </button>
);

/** One column's filters as a popover: each filter's label, then a checklist of its options. */
const FilterPopover = <T,>({
  filters,
  rows,
  active,
  onToggle,
  onClear,
}: {
  filters: IColumnFilter<T>[];
  rows: T[];
  active: ActiveFilters;
  onToggle: (key: string, value: string, isChecked: boolean) => void;
  onClear: (keys: string[]) => void;
}) => {
  const keys = filters.map((filter) => filter.key);
  const activeCount = keys.reduce((count, key) => count + (active[key]?.length ?? 0), 0);
  return (
    <Popover
      trigger={
        <button
          type="button"
          aria-label="Filter column"
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            activeCount ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <FunnelSimpleIcon weight={activeCount ? 'fill' : 'bold'} className="h-3.5 w-3.5" />
        </button>
      }
      triggerClassName="shrink-0"
      className="w-60 rounded-lg p-0 shadow-lg"
    >
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-3 normal-case tracking-normal">
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col gap-1.5">
            <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{filter.label}</p>
            {optionsFor(filter, rows).map((option) => (
              <Checkbox
                key={option.value}
                id={`filter-${filter.key}-${option.value}`}
                label={typeof option.label === 'string' ? option.label : option.value}
                checked={active[filter.key]?.includes(option.value) ?? false}
                onChange={(isChecked) => onToggle(filter.key, option.value, isChecked)}
              />
            ))}
          </div>
        ))}
      </div>
      {activeCount ? (
        <div className="border-t border-border px-3 py-2">
          <Button isSubtle className="px-2 py-1 text-xs" text="Clear" onClick={() => onClear(keys)} />
        </div>
      ) : null}
    </Popover>
  );
};

export const DataTable = <T extends object>({
  rows,
  columns,
  emptyState,
  isLoading,
  onRowClick,
  className,
}: IProps<T>) => {
  const [sort, setSort] = React.useState<ISort | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilters>({});

  const allFilters = React.useMemo(() => columns.flatMap((column) => column.filters ?? []), [columns]);
  const isFiltered = Object.values(activeFilters).some((values) => values.length > 0);

  // Filtering is the table's own, like sorting: ticked values are ORed within a filter and ANDed
  // across filters, which is how "Class 10 or 11, drafts only" reads.
  const filteredRows = React.useMemo(() => {
    if (!isFiltered) return rows;
    return rows.filter((row) => allFilters.every((filter) => rowPassesFilter(row, filter, activeFilters[filter.key])));
  }, [rows, allFilters, activeFilters, isFiltered]);

  const toggleFilterValue = (key: string, value: string, isChecked: boolean) => {
    setActiveFilters((current) => {
      const values = current[key] ?? [];
      return { ...current, [key]: isChecked ? [...values, value] : values.filter((item) => item !== value) };
    });
  };

  const clearFilters = (keys?: string[]) => {
    if (!keys) {
      setActiveFilters({});
      return;
    }
    setActiveFilters((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.includes(key))));
  };

  // Sorting is the table's own: the caller hands over rows in their natural order and the header
  // reorders a copy. A third click on the same header clears the sort and restores that order.
  const sortedRows = React.useMemo(() => {
    if (!sort) return filteredRows;
    const column = columns.find((item) => item.dataKey === sort.dataKey);
    if (!column) return filteredRows;
    const valueOf = (row: T) =>
      column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.dataKey];
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => compareValues(valueOf(a), valueOf(b)) * sign);
  }, [filteredRows, columns, sort]);

  const toggleSort = (dataKey: string) => {
    setSort((current) => {
      if (current?.dataKey !== dataKey) return { dataKey, direction: 'asc' };
      if (current.direction === 'asc') return { dataKey, direction: 'desc' };
      return null;
    });
  };

  const fixedHeaderContent = () => {
    return (
      <tr>
        {columns.map((column) => {
          const isAction = column.dataKey === ACTIONS;
          const align = column.align ?? 'left';
          const isSortable = Boolean(column.isSortable || column.sortValue) && !isAction;
          const filters = isAction ? [] : (column.filters ?? []);
          const direction = sort?.dataKey === column.dataKey ? sort.direction : undefined;
          const ariaSort = direction ? ARIA_SORT[direction] : 'none';
          const label = isSortable ? (
            <SortButton
              label={column.label}
              align={align}
              direction={direction}
              onClick={() => toggleSort(column.dataKey)}
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{column.label}</span>
          );
          return (
            <th
              key={column.dataKey}
              style={{ width: column.width || DEFAULT_CELL_WIDTH }}
              className={headerClass(isAction, align)}
              title={column.label}
              aria-sort={isSortable ? ariaSort : undefined}
            >
              {isSortable || filters.length ? (
                <div className={cn('flex items-center gap-1', JUSTIFY_CLASS[align])}>
                  {label}
                  {filters.length ? (
                    <FilterPopover
                      filters={filters}
                      rows={rows}
                      active={activeFilters}
                      onToggle={toggleFilterValue}
                      onClear={clearFilters}
                    />
                  ) : null}
                </div>
              ) : (
                column.label
              )}
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
              className={cn(
                'truncate border-b border-border px-3 py-2.5 align-middle',
                ALIGN_CLASS[column.align ?? 'left'],
                isAction && 'sticky right-0 bg-background group-hover/row:bg-accent',
              )}
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
                className="border-b border-border px-3 py-3"
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
    // The caller's empty state describes an empty collection; this one is the table's own filters
    // leaving nothing, and the way out is to loosen them.
    if (!sortedRows.length) {
      return (
        <div className="flex h-full items-center justify-center">
          <BlankState
            label="Nothing matches these filters"
            description="Untick a value, or clear the filters to see every row."
            action={<Button isSecondary text="Clear filters" onClick={() => clearFilters()} />}
          />
        </div>
      );
    }
    return (
      <TableVirtuoso
        data={sortedRows as Record<string, unknown>[]}
        context={{ onRowClick: onRowClick as ITableContext['onRowClick'] }}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={(index, row) => rowContent(index, row as T)}
        className="w-full"
        style={{ height: '100%' }}
      />
    );
  };

  return (
    <div
      className={cn(
        'flex h-[calc(100vh-148px)] w-full flex-col overflow-hidden rounded-lg border border-border bg-background sm:h-[calc(100vh-156px)]',
        className,
      )}
    >
      {isFiltered && !isLoading ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-primary/5 px-4 py-1.5 text-xs text-foreground">
          <FunnelSimpleIcon weight="fill" className="h-3.5 w-3.5 text-primary" />
          <span>
            Showing <span className="font-semibold">{sortedRows.length}</span> of {rows.length}
          </span>
          <button
            type="button"
            onClick={() => clearFilters()}
            className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon weight="bold" className="h-3 w-3" />
            Clear filters
          </button>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">{renderBody()}</div>
    </div>
  );
};
