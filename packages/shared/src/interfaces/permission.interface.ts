import { PermissionItem } from '../enums/permission.enum';

export type PermissionConfigOption = {
  label: string;
  value: PermissionItem;
};

export type PermissionConfigItem = {
  label: string;
  description?: string;
} & ({ value: PermissionItem; scopes?: never } | { value?: never; scopes: Record<string, PermissionItem> });

export type PermissionConfig = {
  label: string;
  items: PermissionConfigItem[];
};
