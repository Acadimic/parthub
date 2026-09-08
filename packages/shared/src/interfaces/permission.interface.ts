import { type PermissionItem } from '../enums/permission.enum';

export interface PermissionConfigOption {
  label: string;
  value: PermissionItem;
}

export type PermissionConfigItem = {
  label: string;
  description?: string;
} & ({ value: PermissionItem; scopes?: never } | { value?: never; scopes: Record<string, PermissionItem> });

export interface PermissionConfig {
  label: string;
  items: PermissionConfigItem[];
}
