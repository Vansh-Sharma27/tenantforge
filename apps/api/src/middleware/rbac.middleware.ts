import { Role } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

import { ROLE_HIERARCHY } from "@/types/workspace.types";
import { ForbiddenError } from "@/utils/errors";

/**
 * Factory function that creates middleware to check if user has specific role(s).
 * Useful when only certain roles can perform an action (e.g., only OWNER or ADMIN).
 *
 * @param allowedRoles - Array of roles that are permitted
 * @returns Middleware function
 *
 * @example
 * // Only owners and admins can delete workspace
 * router.delete('/:slug', requireAuth, requireWorkspace, requireRole([Role.OWNER, Role.ADMIN]), deleteWorkspace);
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Ensure tenant middleware ran first
      if (!req.membership) {
        throw new ForbiddenError("Access denied");
      }

      // Check if user's role is in the allowed list
      if (!allowedRoles.includes(req.membership.role)) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Factory function that creates middleware to check if user meets minimum role requirement.
 * Uses role hierarchy: OWNER > ADMIN > MEMBER > VIEWER.
 *
 * This is useful for operations where higher roles automatically have permission.
 * For example, if MEMBER is required, ADMIN and OWNER also have access.
 *
 * @param minRole - Minimum role required
 * @returns Middleware function
 *
 * @example
 * // Members and above can create posts
 * router.post('/posts', requireAuth, requireWorkspace, requireMinRole(Role.MEMBER), createPost);
 *
 * @example
 * // Only admins and owners can invite members
 * router.post('/members/invite', requireAuth, requireWorkspace, requireMinRole(Role.ADMIN), inviteMember);
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Ensure tenant middleware ran first
      if (!req.membership) {
        throw new ForbiddenError("Access denied");
      }

      // Get numeric values from hierarchy
      const userRoleLevel = ROLE_HIERARCHY[req.membership.role];
      const minRoleLevel = ROLE_HIERARCHY[minRole];

      // Check if user's role level meets or exceeds minimum
      if (!userRoleLevel || !minRoleLevel || userRoleLevel < minRoleLevel) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
