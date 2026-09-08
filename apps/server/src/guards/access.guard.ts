import { PERMISSIONS_KEY } from '@decorators/permissions.decorator';
import { IS_PRIVATE_KEY } from '@decorators/private.decorator';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { SUBDOMAINS_KEY } from '@decorators/subdomains.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionItem, Subdomain } from '@repo/shared';
import { RequestContextService } from '../context/request-context.service';

/**
 * Authorization. Runs after AuthGuard, which has already resolved the user and filled the
 * request context, and enforces what a route declares with @Permissions and @Subdomains.
 *
 * A route with neither @Permissions nor @Public/@Private is refused: forgetting to declare
 * access denies the request rather than silently exposing the endpoint.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  private readonly logger = new Logger(AccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private getMetadata<T>(context: ExecutionContext, key: string) {
    return this.reflector.getAllAndOverride<T>(key, [context.getHandler(), context.getClass()]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // AuthGuard has already accepted (or rejected) these on its own terms.
    if (this.getMetadata<boolean>(context, IS_PUBLIC_KEY)) return true;
    if (this.getMetadata<boolean>(context, IS_PRIVATE_KEY)) return true;

    const allowed = this.getMetadata<Subdomain[]>(context, SUBDOMAINS_KEY);
    if (allowed?.length) {
      const subdomain = this.requestContextService.getSubdomain();
      if (!subdomain || !allowed.includes(subdomain)) {
        throw new ForbiddenException('This endpoint is not available for this app.');
      }
    }

    const permissions = this.getMetadata<PermissionItem[]>(context, PERMISSIONS_KEY);

    // Undefined means the route declared nothing, which is refused. An empty list is a
    // deliberate "any member of the organization may call this", written as @Permissions().
    if (permissions === undefined) {
      this.logger.error(
        `${context.getClass().name}.${context.getHandler().name} declares no @Permissions, @Public or @Private.`,
      );
      throw new ForbiddenException('This endpoint declares no required permission.');
    }
    if (permissions.length === 0) return true;

    await this.permissionService.requireAny(permissions);
    return true;
  }
}
