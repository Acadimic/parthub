import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

/** What a limited route hands out: a whole course's lessons, one module's, or one quiz's questions. */
export type RateLimitBucket = 'course' | 'module' | 'quiz';

/**
 * Caps how often one learner may call the route, so an account cannot bulk-download every course.
 * RateLimitGuard counts per user and bucket, in the learning app only; its limits are in the guard.
 */
export const RateLimit = (bucket: RateLimitBucket) => SetMetadata(RATE_LIMIT_KEY, bucket);
