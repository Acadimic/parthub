import { SetMetadata } from '@nestjs/common';
import { Subdomain } from '@parthhub/shared';

export const SUBDOMAINS_KEY = 'subdomains';

/**
 * Restricts a route to the listed apps. Omit it when every app may call the route.
 * AccessGuard compares against the subdomain AuthGuard resolved from the request path.
 */
export const Subdomains = (...subdomains: Subdomain[]) => SetMetadata(SUBDOMAINS_KEY, subdomains);
