export interface ISelectItem {
  label: string;
  value: string;
  description?: string;
  group?: string;
  color?: string;
  icon?: unknown;
}

export interface IDynamicObject {
  [key: string]: number;
}
