export interface ISelectItem {
  label: string;
  value: string;
  description?: string;
  group?: string;
}

export interface IDynamicObject {
  [key: string]: number;
}
