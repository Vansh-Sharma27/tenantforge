import { config } from "@/config";
import { logger } from "@/utils/logger";

import { createApp } from "./app";

const app = createApp();

const server = app.listen(config.server.port, () => {
  logger.info(`Server running on port ${config.server.port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`API URL: ${config.server.apiUrl}`);
});

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Forcing shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
