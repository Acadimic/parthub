import { type AccessType, type DefaultRole, type Subdomain } from '@repo/shared/enums';

export interface IRequestContext {
  userId: string;
  orgId: string;
  permission: DefaultRole;
  apiRoute: string;
  accessType: AccessType;
  subdomain?: Subdomain;
  timezone?: string;
  timezoneOffset?: string;
}
