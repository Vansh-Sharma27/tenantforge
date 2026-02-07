import { auditRepository } from "@/repositories/audit.repository";
import { AuditEvent } from "@/types/audit.types";
import { logger } from "@/utils/logger";

/**
 * Non-blocking audit logging service with in-memory batching
 * Automatically flushes to database on buffer size (100) or time interval (5s)
 */
export class AuditService {
  private buffer: AuditEvent[] = [];
  private readonly maxBufferSize = 100;
  private readonly flushIntervalMs = 5000;
  private timer: NodeJS.Timeout | null = null;
  private flushPromise: Promise<void> | null = null;

  constructor() {
    this.startAutoFlush();
  }

  /**
   * Log an audit event (non-blocking, fire-and-forget)
   */
  log(event: AuditEvent): void {
    this.buffer.push(event);

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      setImmediate(() => {
        this.flush().catch((error) => {
          logger.error({ error }, "Audit auto-flush failed (buffer full)");
        });
      });
    }
  }

  /**
   * Force flush buffer to database (used in tests and graceful shutdown)
   */
  async flush(): Promise<void> {
    // If already flushing, wait for it to complete
    if (this.flushPromise) {
      return this.flushPromise;
    }

    // Nothing to flush
    if (this.buffer.length === 0) {
      return;
    }

    this.flushPromise = this.performFlush();

    try {
      await this.flushPromise;
    } finally {
      this.flushPromise = null;
    }
  }

  /**
   * Internal flush implementation
   */
  private async performFlush(): Promise<void> {
    // Drain buffer
    const eventsToFlush = this.buffer.splice(0, this.buffer.length);

    if (eventsToFlush.length === 0) {
      return;
    }

    try {
      await auditRepository.createMany(eventsToFlush);
      logger.debug({ count: eventsToFlush.length }, "Flushed audit events");
    } catch (error) {
      logger.error({ error, eventCount: eventsToFlush.length }, "Failed to persist audit events");

      // Try to restore events to buffer (with limit to prevent memory issues)
      const maxRestore = Math.min(
        eventsToFlush.length,
        this.maxBufferSize * 2 - this.buffer.length
      );

      if (maxRestore > 0) {
        this.buffer.unshift(...eventsToFlush.slice(0, maxRestore));
      }

      if (maxRestore < eventsToFlush.length) {
        logger.error(
          { droppedCount: eventsToFlush.length - maxRestore },
          "Audit events dropped due to buffer overflow"
        );
      }

      throw error;
    }
  }

  /**
   * Start periodic auto-flush timer
   */
  private startAutoFlush(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        setImmediate(() => {
          this.flush().catch((error) => {
            logger.error({ error }, "Audit periodic flush failed");
          });
        });
      }
    }, this.flushIntervalMs);

    // Allow process to exit even if timer is active
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Stop the audit service (graceful shutdown)
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Flush remaining events
    await this.flush();
  }
}

export const auditService = new AuditService();
