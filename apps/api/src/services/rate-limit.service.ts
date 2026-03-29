import { Plan } from "@prisma/client";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

import { config } from "@/config";
import { redis } from "@/lib/redis";
import { logger } from "@/utils/logger";

export interface RateLimitError {
  rateLimitExceeded: true;
  retryAfter: number;
  remaining: number;
  reset: Date;
  limit: number;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return typeof error === "object" && error !== null && "rateLimitExceeded" in error;
}

/**
 * Rate limiting service using Redis backend
 */
export class RateLimitService {
  public readonly globalLimiter: RateLimiterRedis;
  public readonly authLimiter: RateLimiterRedis;
  public readonly workspaceLimiters: Record<Plan, RateLimiterRedis>;

  constructor() {
    // Global rate limiter (IP-based)
    this.globalLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "ratelimit:global",
      points: config.rateLimit.global.points,
      duration: config.rateLimit.global.duration,
    });

    // Auth rate limiter (stricter, IP-based)
    this.authLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "ratelimit:auth",
      points: config.rateLimit.auth.points,
      duration: config.rateLimit.auth.duration,
    });

    // Workspace rate limiters (plan-based, daily limits)
    const DAY_IN_SECONDS = 86400;

    this.workspaceLimiters = {
      [Plan.FREE]: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "ratelimit:workspace:free",
        points: 1000,
        duration: DAY_IN_SECONDS,
      }),
      [Plan.PRO]: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "ratelimit:workspace:pro",
        points: 50000,
        duration: DAY_IN_SECONDS,
      }),
      [Plan.ENTERPRISE]: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "ratelimit:workspace:enterprise",
        points: 1000000,
        duration: DAY_IN_SECONDS,
      }),
    };
  }

  /**
   * Consume rate limit points
   */
  async consume(limiter: RateLimiterRedis, key: string, points: number = 1) {
    try {
      const result = await limiter.consume(key, points);
      return {
        remaining: result.remainingPoints,
        reset: new Date(Date.now() + result.msBeforeNext),
        limit: limiter.points,
      };
    } catch (rejRes: unknown) {
      // Rate limit exceeded (RateLimiterRes has msBeforeNext)
      if (rejRes instanceof RateLimiterRes && rejRes.msBeforeNext > 0) {
        logger.warn({ key, msBeforeNext: rejRes.msBeforeNext }, "Rate limit exceeded");
        const rateLimitError: RateLimitError = {
          rateLimitExceeded: true,
          retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
          remaining: 0,
          reset: new Date(Date.now() + rejRes.msBeforeNext),
          limit: limiter.points,
        };
        throw rateLimitError;
      }

      // Other error
      logger.error({ error: rejRes, key }, "Rate limiter error");
      throw rejRes;
    }
  }

  /**
   * Get workspace limiter by plan
   */
  getWorkspaceLimiter(plan: Plan): RateLimiterRedis {
    return this.workspaceLimiters[plan] || this.workspaceLimiters[Plan.FREE];
  }
}

export const rateLimitService = new RateLimitService();
