import { Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { Resend } from "resend";

import { config } from "@/config";
import type { EmailJobData } from "@/lib/queue";
import { generateInvitationEmail } from "@/templates/invitation";
import { generateMemberRemovedEmail } from "@/templates/member-removed";
import { generateRoleChangedEmail } from "@/templates/role-changed";
import { generateWelcomeEmail } from "@/templates/welcome";
import { logger } from "@/utils/logger";

/**
 * Initialize Resend client (only if email is enabled)
 */
const resend = config.email.enabled && config.email.apiKey ? new Resend(config.email.apiKey) : null;

/**
 * Redis connection for worker
 */
const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Process email job based on type
 */
async function processEmailJob(job: Job<EmailJobData>) {
  const { type, to, data } = job.data;

  logger.info(
    {
      jobId: job.id,
      type,
      to,
    },
    "Processing email job"
  );

  let emailContent: { subject: string; html: string } | null = null;

  // Generate email content based on type
  switch (type) {
    case "INVITATION":
      emailContent = generateInvitationEmail({
        workspaceName: data.workspaceName,
        inviterName: data.inviterName,
        role: data.role,
        invitationUrl: data.invitationUrl,
      });
      break;

    case "WELCOME":
      emailContent = generateWelcomeEmail({
        workspaceName: data.workspaceName,
        workspaceUrl: data.workspaceUrl,
      });
      break;

    case "ROLE_CHANGED":
      emailContent = generateRoleChangedEmail({
        workspaceName: data.workspaceName,
        oldRole: data.oldRole,
        newRole: data.newRole,
        workspaceUrl: data.workspaceUrl,
      });
      break;

    case "MEMBER_REMOVED":
      emailContent = generateMemberRemovedEmail({
        workspaceName: data.workspaceName,
      });
      break;

    case "VERIFICATION":
    case "PASSWORD_RESET":
      // TODO: Implement verification and password reset templates
      logger.warn({ type }, "Email template not yet implemented");
      return;

    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  if (!emailContent) {
    throw new Error("Failed to generate email content");
  }

  // If email is disabled, just log the email content
  if (!config.email.enabled) {
    logger.info(
      {
        jobId: job.id,
        type,
        to,
        subject: emailContent.subject,
      },
      "Email sending disabled - would send email"
    );
    return;
  }

  // Send email using Resend
  if (!resend) {
    throw new Error("Resend client not initialized");
  }

  try {
    const result = await resend.emails.send({
      from: config.email.from,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logger.info(
      {
        jobId: job.id,
        type,
        to,
        emailId: result.data?.id,
      },
      "Email sent successfully"
    );

    return result;
  } catch (error) {
    logger.error(
      {
        jobId: job.id,
        type,
        to,
        error,
      },
      "Failed to send email"
    );
    throw error;
  }
}

/**
 * Email worker instance
 */
export const emailWorker = new Worker<EmailJobData>("email", processEmailJob, {
  connection,
  concurrency: 5, // Process up to 5 emails concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second (respects Resend rate limits)
  },
});

emailWorker.on("completed", (job) => {
  logger.info(
    {
      jobId: job.id,
      type: job.data.type,
    },
    "Email job completed"
  );
});

emailWorker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      type: job?.data.type,
      error: err,
      attemptsMade: job?.attemptsMade,
    },
    "Email job failed"
  );
});

emailWorker.on("error", (error) => {
  logger.error({ error }, "Email worker error");
});

logger.info("Email worker initialized");

/**
 * Graceful shutdown for email worker
 */
export async function shutdownEmailWorker() {
  logger.info("Shutting down email worker...");
  await emailWorker.close();
  await connection.quit();
  logger.info("Email worker shut down");
}
