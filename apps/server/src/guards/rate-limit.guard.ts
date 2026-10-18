import { RATE_LIMIT_KEY, type RateLimitBucket } from '@decorators/rate-limit.decorator';
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Subdomain } from '@repo/shared/enums';
import { RequestContextService } from '../context/request-context.service';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

interface ILimit {
  /** At most `count` calls in any `windowMs`, which a burst of scripted requests hits first. */
  burst: { count: number; windowMs: number };
  /** At most this many in any 24 hours, which a slow, patient script hits instead. */
  daily: number;
}

/**
 * Well above what a learner reads: reading a 41-module course through in the book is about 50 module
 * fetches with the prefetch, and printing a whole course is one course call plus one per quiz, so
 * either can be done twice in ten minutes. The daily caps are what slow a patient script.
 */
const LIMITS: Record<RateLimitBucket, ILimit> = {
  course: { burst: { count: 10, windowMs: 60 * MINUTE }, daily: 30 },
  module: { burst: { count: 100, windowMs: 10 * MINUTE }, daily: 400 },
  quiz: { burst: { count: 100, windowMs: 10 * MINUTE }, daily: 400 },
};

/** How often idle users' call times are swept out, so the map does not grow without end. */
const SWEEP_EVERY_MS = 10 * MINUTE;

/**
 * Per-learner limits on the routes that hand out lesson bodies and quiz questions, declared with
 * @RateLimit. Runs after AccessGuard, so only an allowed call is counted. The teaching app is not
 * limited: a teacher reads their own courses there.
 *
 * Counts live in this instance's memory. Cloud Run runs up to five instances, so a script spread
 * across them gets at most five times the limit; that still turns minutes of scraping into days.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  /** Call times per `user:bucket`, oldest first, none older than a day. */
  private readonly calls = new Map<string, number[]>();
  private lastSweep = Date.now();

  constructor(
    private readonly reflector: Reflector,
    private readonly requestContextService: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const bucket = this.reflector.getAllAndOverride<RateLimitBucket>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!bucket || this.requestContextService.getSubdomain() !== Subdomain.LEARN) return true;

    const now = Date.now();
    this.sweep(now);
    const key = `${this.requestContextService.getUserId().toHexString()}:${bucket}`;
    const recent = (this.calls.get(key) ?? []).filter((time) => time > now - DAY);
    const { burst, daily } = LIMITS[bucket];
    const inBurst = recent.filter((time) => time > now - burst.windowMs).length;

    if (inBurst >= burst.count || recent.length >= daily) {
      this.calls.set(key, recent);
      this.logger.warn(`Rate limit reached: ${key} (${inBurst} recent, ${recent.length} today)`);
      throw new HttpException(
        'You are opening lessons faster than we allow. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.calls.set(key, recent);
    return true;
  }

  private sweep(now: number) {
    if (now - this.lastSweep < SWEEP_EVERY_MS) return;
    this.lastSweep = now;
    for (const [key, times] of this.calls) {
      if (!times.length || times[times.length - 1] <= now - DAY) this.calls.delete(key);
    }
  }
}
