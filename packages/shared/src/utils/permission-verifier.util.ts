import { type RoleDto } from '../dtos/validations/role/role.dto';
import { type PermissionItem } from '../enums/permission.enum';

export function hasPermission(role: RoleDto, permission: PermissionItem): boolean {
  return role.permissions.includes(permission);
}

export function hasAnyPermission(role: RoleDto, permissions: PermissionItem[]): boolean {
  return permissions.some((p) => role.permissions.includes(p));
}
