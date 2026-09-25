import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccessType, DefaultRole, Subdomain } from '@repo/shared/enums';
import { Types } from 'mongoose';
import { ClsServiceManager } from 'nestjs-cls';
import { IRequestContext } from './request-context.interface';

/**
 * The current request's identity and headers, read out of the CLS store `AuthGuard` fills.
 *
 * Every getter here throws rather than returning `undefined`: `AuthGuard` runs on every route and
 * writes a complete `IRequestContext`, so an absent one means the guard did not run and a caller
 * reading through it is already wrong. The one gap is a `@Public()` route, which has no identity
 * and carries empty-string ids — `getUserId`/`getOrgId` throw a `BSONError` there, which is correct
 * only because nothing public writes. Use `getContextSafe` where a missing context is expected.
 */
@Injectable()
export class RequestContextService {
  getContext(): IRequestContext {
    const context = this.getContextSafe();
    if (!context) {
      throw new InternalServerErrorException('Request context is not available. Ensure AuthGuard is running.');
    }
    return context;
  }

  /** The context, or undefined outside a request (bootstrap, cron, worker) — never throws. */
  getContextSafe(): IRequestContext | undefined {
    const cls = ClsServiceManager.getClsService();
    return cls?.get('requestContext');
  }

  getUserId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().userId);
  }

  getOrgId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().orgId);
  }

  /** What the caller is in the current organization. Public and private routes both read ADMIN. */
  getPermission(): DefaultRole {
    return this.getContext().permission;
  }

  getSubdomain(): Subdomain {
    return this.getContext().subdomain;
  }

  /**
   * Runs `fn` with the context's org swapped for `org`, then restores it.
   * The change-tracking plugin stamps every inserted document with the context org,
   * so writes that must land in another org (invite acceptance) go through here.
   */
  async withOrg<T>(org: string | Types.ObjectId, fn: () => Promise<T>): Promise<T> {
    const cls = ClsServiceManager.getClsService();
    const context = this.getContext();
    const previousOrgId = context.orgId;
    cls.set('requestContext', { ...context, org: String(org) });
    try {
      return await fn();
    } finally {
      cls.set('requestContext', { ...this.getContext(), org: previousOrgId });
    }
  }

  getApiRoute(): string {
    const context = this.getContext();
    return context.apiRoute;
  }

  getAccessType(): AccessType {
    const context = this.getContext();
    return context.accessType;
  }

  getTimezone(): string {
    const context = this.getContext();
    return context.timezone;
  }

  getTimezoneOffset(): string {
    const context = this.getContext();
    return context.timezoneOffset;
  }
}
