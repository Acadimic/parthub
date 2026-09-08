import { SetMetadata } from '@nestjs/common';
import { PermissionItem } from '@parthhub/shared';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares which permissions may call a route. Checked as any-of by AccessGuard.
 *
 * Every authenticated route needs this decorator; a route without it is not callable.
 * Write `@Permissions()` with no arguments when any member of the organization may call it,
 * which is deliberate and visible, unlike omitting the decorator.
 */
export const Permissions = (...permissions: PermissionItem[]) => SetMetadata(PERMISSIONS_KEY, permissions);
