import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { auditRepository } from "@/repositories/audit.repository";

const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
});

export class AuditController {
  /**
   * GET /api/v1/workspaces/:slug/audit
   * List audit logs for a workspace
   */
  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = req.workspace!;
      const query = listAuditLogsSchema.parse(req.query);

      const skip = (query.page - 1) * query.limit;
      const [logs, total] = await Promise.all([
        auditRepository.findByWorkspace(workspace.id, {
          skip,
          take: query.limit,
          action: query.action,
        }),
        auditRepository.countByWorkspace(workspace.id, query.action),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
