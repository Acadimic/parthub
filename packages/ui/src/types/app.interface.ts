import type { ReactNode } from 'react';
import type { IColor as ISharedColor, ISelectItem as ISharedSelectItem } from '@repo/shared';

export type IColor = ISharedColor;

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

export interface IColumnData<T = unknown> {
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
