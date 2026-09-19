import type { ReactNode } from 'react';
import type { IColor, ISelectItem as ISharedSelectItem } from '@repo/shared/interfaces';

export type { IColor };

export interface ISelectItem extends Omit<ISharedSelectItem, 'label' | 'icon'> {
  label: string | ReactNode;
  icon?: ReactNode;
}

export interface IMenuItem<T = unknown> {
  label: string | ReactNode;
  icon?: ReactNode;
  value?: string;
  onClick: (row?: T) => void;
  isCurrent?: boolean;
}

/**
 * A filter a column header offers: a checklist of values, and how a row is read against it.
 *
 * A column may carry more than one — a "Paper" column can filter by standard and by subject — and
 * the header groups them under their labels in a single popover.
 */
export interface IColumnFilter<T = unknown> {
  /** Unique within the table. */
  key: string;
  label: string;
  /** The row's value or values for this filter. A row matches when any of them is ticked. */
  getValues: (row: T) => (string | number | null | undefined)[] | string | number | null | undefined;
  /** The options to offer. Absent, they are the distinct values found in the rows, in order. */
  options?: ISelectItem[];
}

/** Where a column's text sits. Numbers go right so their digits line up; text stays left. */
export type ColumnAlign = 'left' | 'center' | 'right';

export interface IColumnData<T = unknown> {
  dataKey: string;
  label: string;
  width?: number;
  align?: ColumnAlign;
  /** Lets the header sort the rows. Sorts by the raw `dataKey` value unless `sortValue` says otherwise. */
  isSortable?: boolean;
  /** The value to sort a row by, for a column whose displayed value is derived — a name looked up from an id. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Filters the header offers behind a funnel button. Rows are filtered by the table itself. */
  filters?: IColumnFilter<T>[];
  valueFormatter?: (row: T) => string | ReactNode;
  tooltipTitle?: (row: T) => string | ReactNode;
  menuItems?: IMenuItem<T>[];
  getColor?: (row: T) => IColor;
  component?: (row: T) => ReactNode;
}

export interface IStep {
  label: string;
  component: ReactNode;
  onSubmit?: () => void;
}

export interface IAccordionItem {
  id?: string;
  title: string | ReactNode;
  component: string | ReactNode;
}
