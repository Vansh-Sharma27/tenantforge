import type { Prisma } from "@prisma/client";

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
      data: events.map(
        (e): Prisma.AuditLogCreateManyInput => ({
          workspaceId: e.workspaceId,
          actorId: e.actorId,
          actorType: e.actorType,
          action: e.action,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          metadata: (e.metadata ?? {}) as Prisma.InputJsonValue,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
        })
      ),
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
    return prisma.auditLog.findMany({
      where: {
        workspaceId,
        ...(options.action ? { action: { startsWith: options.action } } : {}),
      },
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
    return prisma.auditLog.count({
      where: {
        workspaceId,
        ...(action ? { action: { startsWith: action } } : {}),
      },
    });
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
