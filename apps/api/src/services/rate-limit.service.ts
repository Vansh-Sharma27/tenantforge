import { Plan } from "@prisma/client";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { config } from "@/config";
import { redis } from "@/lib/redis";
import { logger } from "@/utils/logger";

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
    } catch (rejRes: any) {
      // Rate limit exceeded
      if (rejRes?.msBeforeNext) {
        logger.warn({ key, msBeforeNext: rejRes.msBeforeNext }, "Rate limit exceeded");
        throw {
          rateLimitExceeded: true,
          retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
          remaining: 0,
          reset: new Date(Date.now() + rejRes.msBeforeNext),
          limit: limiter.points,
        };
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
