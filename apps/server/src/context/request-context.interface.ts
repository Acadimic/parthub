import { AccessType, Subdomain } from '@parthhub/shared';

export interface IRequestContext {
  userId: string;
  org: string;
  role: string;
  apiRoute: string;
  accessType: AccessType;
  subdomain?: Subdomain;
  timezone?: string;
  timezoneOffset?: string;
}
