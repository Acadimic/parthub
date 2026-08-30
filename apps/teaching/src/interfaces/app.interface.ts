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

export interface IColumnData {
  dataKey: string;
  label: string;
  width?: number;
  valueFormatter?: (row: any) => string | React.ReactNode;
  tooltipTitle?: (row: any) => string | React.ReactNode;
  menuItems?: IMenuItem[];
  getColor?: (row: any) => IColor;
  component?: (row: any) => React.ReactNode;
}

export interface IMenuItem {
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  value?: string;
  onClick: (row?: any) => void;
  isCurrent?: boolean;
}

export interface IStep {
  label: string;
  component: React.ReactNode;
  onSubmit?: () => void;
}

export interface IColor {
  color: string;
  bg: string;
}

export interface IAccordionItem {
  id?: string;
  title: string | React.ReactNode;
  component: string | React.ReactNode;
}

export interface IScoreRating {
  color: string;
  text: string;
}
