import { AccessType } from '@parthhub/shared';

export interface IRequestContext {
  userId: string;
  orgId: string;
  role: string;
  apiRoute: string;
  accessType: AccessType;
  timezone?: string;
  timezoneOffset?: string;
}
