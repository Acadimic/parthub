import { AccessType, Subdomain } from '@repo/shared';

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
