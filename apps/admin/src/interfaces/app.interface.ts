export interface ISelectItem {
  label: string | React.ReactNode;
  value: string;
  description?: string;
  group?: string;
  color?: string;
}

export interface IDynamicObject {
  [key: string]: number;
}

export interface IColumnData<T extends object = Record<string, unknown>> {
  dataKey: string;
  label: string;
  width?: number;
  valueFormatter?: (row: T) => string | React.ReactNode;
  tooltipTitle?: (row: T) => string | React.ReactNode;
  menuItems?: IMenuItem<T>[];
  getColor?: (row: T) => IColor;
  component?: (row: T) => React.ReactNode;
}

export interface IMenuItem<T = unknown> {
  label: string;
  icon: React.ReactNode;
  onClick: (row?: T) => void;
  isCurrent?: boolean;
}

export interface IColor {
  color: string;
  bg: string;
}
