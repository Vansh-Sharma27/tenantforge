import { config } from "@/config";
import { logger } from "@/utils/logger";
import { shutdownEmailWorker } from "@/workers/email.worker";

import { createApp } from "./app";

const app = createApp();

const server = app.listen(config.server.port, () => {
  logger.info(`Server running on port ${config.server.port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`API URL: ${config.server.apiUrl}`);
  logger.info(`Email enabled: ${config.email.enabled}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully...");

  // Close server first
  server.close(async () => {
    try {
      // Shutdown email worker
      await shutdownEmailWorker();
      logger.info("All services closed");
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Forcing shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
