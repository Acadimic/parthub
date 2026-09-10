import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionItem } from '@repo/shared/enums';
import { DEFAULT_PERMISSIONS } from '@repo/shared/utils';
import { RequestContextService } from '../../context/request-context.service';

@Injectable()
export class PermissionService {
  constructor(private readonly requestContextService: RequestContextService) {}

  async requireAny(permissions: PermissionItem[]): Promise<void> {
    if (!this.hasAnyPermission(permissions)) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
  }

  /**
   * What the caller may do, straight from the static map.
   *
   * There is no database read and nothing to join: a member's `permission` is stored on the user
   * document and the auth guard has already put it on the request context.
   */
  getEffectivePermissions(): PermissionItem[] {
    const permission = this.requestContextService.getPermission();
    if (!permission) return [];
    return DEFAULT_PERMISSIONS[permission] ?? [];
  }

  hasPermission(permission: PermissionItem): boolean {
    return this.hasAnyPermission([permission]);
  }

  hasAnyPermission(permissions: PermissionItem[]): boolean {
    const effective = this.getEffectivePermissions();
    return permissions.some((permission) => effective.includes(permission));
  }
}
