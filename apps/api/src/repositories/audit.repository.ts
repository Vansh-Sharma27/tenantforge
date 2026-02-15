import { prisma } from "@/lib/prisma";
import { AuditEvent } from "@/types/audit.types";

/**
 * Audit log repository for database operations
 */
export class AuditRepository {
  /**
   * Batch insert audit log events
   */
  async createMany(events: AuditEvent[]) {
    return prisma.auditLog.createMany({
      data: events as any, // Type cast needed for JsonValue compatibility
      skipDuplicates: true,
    });
  }

  /**
   * Find audit logs by workspace with pagination and optional filters
   */
  async findByWorkspace(
    workspaceId: string,
    options: { skip: number; take: number; action?: string }
  ) {
    const where: Record<string, unknown> = { workspaceId };
    if (options.action) {
      where.action = options.action;
    }

    return prisma.auditLog.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find audit logs by actor (user) with pagination
   */
  async findByActor(actorId: string, options: { skip: number; take: number }) {
    return prisma.auditLog.findMany({
      where: { actorId },
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Count audit logs by workspace
   */
  async countByWorkspace(workspaceId: string, action?: string): Promise<number> {
    const where: Record<string, unknown> = { workspaceId };
    if (action) {
      where.action = action;
    }
    return prisma.auditLog.count({ where });
  }

  /**
   * Count audit logs by actor
   */
  async countByActor(actorId: string): Promise<number> {
    return prisma.auditLog.count({
      where: { actorId },
    });
  }
}

export const auditRepository = new AuditRepository();
