import { Router } from "express";

import { authController } from "@/controllers/auth.controller";

const router = Router();

/**
 * Authentication routes
 */

// Registration and verification
router.post("/register", (req, res, next) => authController.register(req, res, next));
router.post("/verify-email", (req, res, next) => authController.verifyEmail(req, res, next));

// Login and token management
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/refresh", (req, res, next) => authController.refresh(req, res, next));

// Password recovery
router.post("/forgot-password", (req, res, next) => authController.forgotPassword(req, res, next));
router.post("/reset-password", (req, res, next) => authController.resetPassword(req, res, next));

export default router;
