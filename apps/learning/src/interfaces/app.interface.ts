import { IColor, ISelectItem } from '@parthhub/shared';

export interface IColumnData<T = Record<string, unknown>> {
  dataKey: string;
  label: string;
  width?: number;
  valueFormatter?: (row: T) => string | React.ReactNode;
  tooltipTitle?: (row: T) => string | React.ReactNode;
  menuItems?: IMenuItem[];
  getColor?: (row: T) => IColor;
  component?: (row: T) => React.ReactNode;
}

export interface IMenuItem {
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  onClick: (row?: unknown) => void;
  isCurrent?: boolean;
}

export interface IStep {
  label: string;
  component: React.ReactNode;
  onSubmit?: () => void;
}
