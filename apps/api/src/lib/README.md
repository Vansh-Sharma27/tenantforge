# Email Infrastructure Architecture

## Overview

BullMQ-based email queueing system with Resend integration for reliable email delivery.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Email Infrastructure                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   API Route  │────────▶│Email Service │────────▶│  Email Queue │
│  (Express)   │         │  (queuing)   │         │   (BullMQ)   │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │ Redis
                                                          │
                                                          ▼
                         ┌──────────────┐         ┌──────────────┐
                         │    Resend    │◀────────│Email Worker  │
                         │     API      │         │ (processing) │
                         └──────┬───────┘         └──────────────┘
                                │
                                │ SMTP
                                ▼
                         ┌──────────────┐
                         │   User's     │
                         │   Inbox      │
                         └──────────────┘
```

## Flow Example: Send Invitation

```
1. POST /api/workspaces/:id/members/invite
   │
   ├─▶ MemberController.inviteMembers()
   │   │
   │   ├─▶ Create invitation in database
   │   │
   │   └─▶ emailService.sendInvitationEmail(...)
   │       │
   │       └─▶ emailQueue.add("invitation", { ... })
   │           │
   │           └─▶ Job stored in Redis
   │
   └─▶ Return 200 OK (non-blocking)

[Background Processing]

2. Email Worker picks up job
   │
   ├─▶ Retrieve job data from Redis
   │
   ├─▶ Generate HTML email from template
   │
   ├─▶ If EMAIL_ENABLED = false:
   │   └─▶ Log email content (development)
   │
   ├─▶ If EMAIL_ENABLED = true:
   │   └─▶ resend.emails.send({ ... })
   │       │
   │       └─▶ Email delivered via SMTP
   │
   ├─▶ Mark job as completed
   │
   └─▶ Remove from queue (after retention period)
```

## Components

### 1. Email Queue (`queue.ts`)

- Initializes BullMQ with Redis
- Defines job types and data structure
- Configures retry and retention policies

### 2. Email Service (`../services/email.service.ts`)

- Public API for queueing email jobs
- Handles URL generation
- Logs queued emails

### 3. Email Worker (`../workers/email.worker.ts`)

- Processes jobs from queue
- Generates email content from templates
- Sends via Resend or logs in dev mode
- Handles retries and errors

### 4. Email Templates (`../templates/*.ts`)

- HTML email templates
- Type-safe data interfaces
- Professional, responsive design

## Configuration

### Environment Variables

```env
# Email Service
RESEND_API_KEY=re_...        # Required for production
EMAIL_FROM=noreply@...        # Sender email address
EMAIL_ENABLED=false           # Enable actual sending
FRONTEND_URL=http://...       # For email links

# Redis (required)
REDIS_URL=redis://...         # BullMQ connection
```

### Job Configuration

```typescript
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000  // 2s, 4s, 8s
  },
  removeOnComplete: {
    age: 3600,   // 1 hour
    count: 1000  // Last 1000 jobs
  },
  removeOnFail: {
    age: 86400   // 24 hours
  }
}
```

### Worker Configuration

```typescript
{
  concurrency: 5,        // Process 5 jobs simultaneously
  limiter: {
    max: 10,             // 10 jobs
    duration: 1000       // per second
  }
}
```

## Development Mode

When `EMAIL_ENABLED=false`, emails are logged instead of sent:

```json
{
  "level": "info",
  "msg": "Email sending disabled - would send email",
  "jobId": "1",
  "type": "INVITATION",
  "to": "user@example.com",
  "subject": "You've been invited to join Acme Corp"
}
```

This allows development without:

- Consuming API quota
- Spamming test emails
- Requiring Resend configuration

## Production Mode

When `EMAIL_ENABLED=true`, emails are sent via Resend:

```json
{
  "level": "info",
  "msg": "Email sent successfully",
  "jobId": "1",
  "type": "INVITATION",
  "to": "user@example.com",
  "emailId": "re_abc123xyz"
}
```

## Error Handling

### Retry Strategy

Jobs are retried up to 3 times with exponential backoff:

1. **First attempt fails** → Wait 2 seconds → Retry
2. **Second attempt fails** → Wait 4 seconds → Retry
3. **Third attempt fails** → Wait 8 seconds → Retry
4. **All attempts exhausted** → Mark as failed, log error

### Failure Scenarios

| Scenario              | Handling                    |
| --------------------- | --------------------------- |
| Resend API error      | Retry with backoff          |
| Invalid email address | Fail immediately (no retry) |
| Rate limit exceeded   | Retry with backoff          |
| Network timeout       | Retry with backoff          |
| Template error        | Fail immediately (fix code) |

### Monitoring Failed Jobs

Failed jobs are retained for 24 hours for debugging:

```bash
# View failed jobs (if BullMQ Board installed)
pnpm add -D @bull-board/express @bull-board/api
```

## Testing

### Unit Tests

```bash
cd apps/api
pnpm test email.service.test.ts
```

### Manual Testing

```bash
cd apps/api
pnpm tsx scripts/test-email.ts
```

### Integration Testing

```typescript
import { emailQueue } from "@/lib/queue";

// Check job was queued
const job = await emailQueue.getJob(jobId);
expect(job).toBeDefined();
expect(job.data.type).toBe("INVITATION");
```

## Monitoring

### Queue Metrics

Monitor via BullMQ events:

- `completed` - Successful deliveries
- `failed` - Delivery failures
- `error` - Worker errors

### Key Metrics to Track

- Email send rate (emails/minute)
- Failure rate (%)
- Retry rate (%)
- Queue depth (jobs waiting)
- Processing time (ms/job)

## Scaling

### Horizontal Scaling

Deploy multiple worker instances:

```bash
# Worker Instance 1
node dist/index.js

# Worker Instance 2 (separate process)
node dist/workers/email.worker.js
```

Workers will automatically distribute work via Redis.

### Vertical Scaling

Increase worker concurrency:

```typescript
concurrency: 20; // Process 20 jobs simultaneously
```

### Rate Limiting

Respect Resend API limits:

- Free: 100 emails/day
- Pro: 50,000 emails/month
- Enterprise: Custom limits

Adjust worker rate limiter accordingly:

```typescript
limiter: {
  max: 50,         // 50 emails
  duration: 1000   // per second
}
```

## Best Practices

1. **Always queue emails** - Never send synchronously in HTTP handlers
2. **Use typed templates** - Ensure type safety with TypeScript interfaces
3. **Log everything** - Track queued, sent, and failed emails
4. **Monitor failures** - Set up alerts for high failure rates
5. **Test in dev mode** - Use EMAIL_ENABLED=false for development
6. **Graceful shutdown** - Wait for in-flight jobs before stopping
7. **Handle personal data** - Comply with GDPR (delete old jobs)

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection: `redis-cli ping`
2. Check worker is running: Look for "Email worker initialized" log
3. Check queue has jobs: `emailQueue.getJobCounts()`

### Emails Not Sending

1. Verify `EMAIL_ENABLED=true`
2. Check Resend API key is valid
3. Check domain is verified in Resend
4. Review worker error logs

### High Failure Rate

1. Check Resend API status
2. Verify rate limits not exceeded
3. Review error logs for patterns
4. Check email addresses are valid

## Future Enhancements

- [ ] Add BullMQ Board for visual monitoring
- [ ] Implement email previews (save HTML to /tmp)
- [ ] Add email analytics (opens, clicks)
- [ ] Support email attachments
- [ ] Implement per-user throttling (anti-spam)
- [ ] Add email scheduling (send at specific time)
- [ ] Support email templates with i18n
- [ ] Add webhook for delivery status

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Resend Documentation](https://resend.com/docs)
- [IORedis Documentation](https://github.com/redis/ioredis)
