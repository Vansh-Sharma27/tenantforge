import { Queue } from "bullmq";
import IORedis from "ioredis";

import { config } from "@/config";
import { logger } from "@/utils/logger";

/**
 * Email job payload types
 */
export type EmailJobType =
  | "VERIFICATION"
  | "PASSWORD_RESET"
  | "INVITATION"
  | "WELCOME"
  | "ROLE_CHANGED"
  | "MEMBER_REMOVED";

export interface EmailJobData {
  type: EmailJobType;
  to: string;
  data: Record<string, any>;
}

/**
 * Redis connection for BullMQ
 */
const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("error", (error) => {
  logger.error({ error }, "Redis connection error");
});

connection.on("connect", () => {
  logger.info("Redis connected for BullMQ");
});

/**
 * Email queue instance
 */
export const emailQueue = new Queue<EmailJobData>("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 24 * 3600, // Keep failed jobs for 24 hours
    },
  },
});

emailQueue.on("error", (error) => {
  logger.error({ error }, "Email queue error");
});

logger.info("Email queue initialized");
