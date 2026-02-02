import { Router, Request, Response } from "express";

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

// API v1 routes will be mounted here
// router.use('/api/v1/auth', authRoutes);
// router.use('/api/v1/users', userRoutes);
// router.use('/api/v1/workspaces', workspaceRoutes);

export default router;
