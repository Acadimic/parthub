import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccessType } from '@parthhub/shared';
import { Types } from 'mongoose';
import { ClsServiceManager } from 'nestjs-cls';
import { IRequestContext } from './request-context.interface';

@Injectable()
export class RequestContextService {
  getContext(): IRequestContext {
    const cls = ClsServiceManager.getClsService();
    const context: IRequestContext = cls?.get('requestContext');
    if (!context) {
      throw new InternalServerErrorException('Request context is not available. Ensure AuthGuard is running.');
    }
    return context;
  }

  getUserId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().userId);
  }

  getOrgId(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().orgId);
  }

  getRole(): Types.ObjectId {
    return new Types.ObjectId(this.getContext().role);
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
