# Email Workers

This directory contains BullMQ workers for processing background jobs.

## Email Worker

The email worker processes email jobs from the `email` queue.

### Supported Email Types

- `INVITATION` - Workspace invitation emails
- `WELCOME` - Welcome emails when members join
- `ROLE_CHANGED` - Role update notifications
- `MEMBER_REMOVED` - Removal notifications
- `VERIFICATION` - Email verification (TODO)
- `PASSWORD_RESET` - Password reset emails (TODO)

### Configuration

Environment variables:

- `EMAIL_ENABLED` - Enable/disable actual email sending (default: false)
- `RESEND_API_KEY` - Resend API key (required when EMAIL_ENABLED=true)
- `EMAIL_FROM` - From email address (default: noreply@tenantforge.dev)
- `FRONTEND_URL` - Frontend URL for email links (default: http://localhost:3000)
- `REDIS_URL` - Redis connection URL (required)

### Development Mode

When `EMAIL_ENABLED=false` (default in development), emails are logged instead of sent:

```
Email sending disabled - would send email
  jobId: "1"
  type: "INVITATION"
  to: "user@example.com"
  subject: "You've been invited to join Acme Corp"
```

### Production Mode

When `EMAIL_ENABLED=true`, emails are sent via Resend:

```
Email sent successfully
  jobId: "1"
  type: "INVITATION"
  to: "user@example.com"
  emailId: "re_abc123xyz"
```

### Worker Configuration

- **Concurrency**: 5 jobs processed simultaneously
- **Rate Limit**: 10 emails per second (Resend free tier: 100/day)
- **Retries**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Retention**: Completed jobs kept for 1 hour, failed jobs for 24 hours

### Testing

Run the test script to queue test emails:

```bash
cd apps/api
tsx scripts/test-email.ts
```

### Monitoring

The worker emits events for monitoring:

- `completed` - Job completed successfully
- `failed` - Job failed after all retries
- `error` - Worker encountered an error

All events are logged via Pino logger.

### Graceful Shutdown

The worker gracefully shuts down when the server receives SIGTERM or SIGINT:

1. Stop accepting new jobs
2. Wait for in-flight jobs to complete
3. Close Redis connection
4. Exit

### Extending

To add new email types:

1. Create template in `src/templates/`
2. Add type to `EmailJobType` in `src/lib/queue.ts`
3. Add case in `processEmailJob()` in `src/workers/email.worker.ts`
4. Add method to `EmailService` in `src/services/email.service.ts`
