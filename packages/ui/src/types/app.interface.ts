import type { ReactNode } from 'react';
import type { IColor as ISharedColor, ISelectItem as ISharedSelectItem } from '@parthhub/shared';

export type IColor = ISharedColor;

export interface ISelectItem extends Omit<ISharedSelectItem, 'label' | 'icon'> {
  label: string | ReactNode;
  icon?: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IMenuItem<T = any> {
  label: string | ReactNode;
  icon?: ReactNode;
  value?: string;
  onClick: (row?: T) => void;
  isCurrent?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IColumnData<T = any> {
  dataKey: string;
  label: string;
  width?: number;
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
