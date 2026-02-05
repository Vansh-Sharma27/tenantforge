/**
 * Manual test script for email infrastructure
 * Run with: tsx scripts/test-email.ts
 */

import { Role } from "@prisma/client";

import { emailService } from "../src/services/email.service";
import { logger } from "../src/utils/logger";

async function main() {
  logger.info("Testing email infrastructure...");

  try {
    // Test invitation email
    await emailService.sendInvitationEmail(
      "test@example.com",
      "Test Workspace",
      "John Doe",
      Role.MEMBER,
      "test-token-123"
    );
    logger.info("✓ Invitation email queued");

    // Test welcome email
    await emailService.sendWelcomeEmail("test@example.com", "Test Workspace", "test-workspace");
    logger.info("✓ Welcome email queued");

    // Test role changed email
    await emailService.sendRoleChangedEmail(
      "test@example.com",
      "Test Workspace",
      "test-workspace",
      Role.MEMBER,
      Role.ADMIN
    );
    logger.info("✓ Role changed email queued");

    // Test member removed email
    await emailService.sendMemberRemovedEmail("test@example.com", "Test Workspace");
    logger.info("✓ Member removed email queued");

    logger.info("All emails queued successfully!");
    logger.info("Check the worker logs to see if emails are processed (or logged in dev mode)");

    // Wait a bit for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Failed to queue emails");
    process.exit(1);
  }
}

main();
