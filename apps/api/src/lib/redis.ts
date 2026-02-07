import Redis from "ioredis";

import { config } from "@/config";
import { logger } from "@/utils/logger";

// Create Redis client for rate limiting and caching
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error({ error: err }, "Redis connection error");
    return true;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err) => {
  logger.error({ error: err }, "Redis error");
});

export default redis;
