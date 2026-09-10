import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccessType, DefaultRole, Subdomain } from '@repo/shared/enums';
import { Types } from 'mongoose';
import { ClsServiceManager } from 'nestjs-cls';
import { IRequestContext } from './request-context.interface';

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

  /**
   * Ids as ObjectIds, or undefined when absent. `new Types.ObjectId('')` throws, and public and
   * private routes carry a minimal context whose ids are empty strings, so callers that must
   * tolerate an unauthenticated request use these instead of the throwing getters.
   */
  getUserIdSafe(): Types.ObjectId | undefined {
    return this.toObjectId(this.getContextSafe()?.userId);
  }

  getOrgIdSafe(): Types.ObjectId | undefined {
    return this.toObjectId(this.getContextSafe()?.orgId);
  }

  private toObjectId(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) return undefined;
    return new Types.ObjectId(value);
  }

  getUserId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().userId);
  }

  getOrgId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().orgId);
  }

  /** What the caller is in the current organization, or undefined outside an authenticated request. */
  getPermission(): DefaultRole | undefined {
    return this.getContextSafe()?.permission;
  }

  getSubdomain(): Subdomain | undefined {
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

  getApiRoute(): string | undefined {
    const context = this.getContext();
    return context.apiRoute;
  }

  getAccessType(): AccessType | undefined {
    const context = this.getContext();
    return context.accessType;
  }

  getTimezone(): string | undefined {
    const context = this.getContext();
    return context.timezone;
  }

  getTimezoneOffset(): string | undefined {
    const context = this.getContext();
    return context.timezoneOffset;
  }
}
