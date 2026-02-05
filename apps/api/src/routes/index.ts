import { Router, Request, Response } from "express";

import authRoutes from "./auth.routes";
import workspaceRoutes from "./workspace.routes";

const router = Router();

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    },
  });
});

// API v1 routes
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/workspaces", workspaceRoutes);
// router.use('/api/v1/users', userRoutes);

export default router;
