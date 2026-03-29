import { Router } from "express";

import { authController } from "@/controllers/auth.controller";
import { authRateLimit } from "@/middleware/rate-limit.middleware";

const router: Router = Router();

/**
 * Authentication routes
 * All auth routes use stricter rate limiting to prevent brute-force attacks
 */

// Registration and verification
router.post("/register", authRateLimit, (req, res, next) =>
  authController.register(req, res, next)
);
router.post("/verify-email", authRateLimit, (req, res, next) =>
  authController.verifyEmail(req, res, next)
);

// Login and token management
router.post("/login", authRateLimit, (req, res, next) => authController.login(req, res, next));
router.post("/refresh", authRateLimit, (req, res, next) => authController.refresh(req, res, next));

// Password recovery
router.post("/forgot-password", authRateLimit, (req, res, next) =>
  authController.forgotPassword(req, res, next)
);
router.post("/reset-password", authRateLimit, (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export default router;
