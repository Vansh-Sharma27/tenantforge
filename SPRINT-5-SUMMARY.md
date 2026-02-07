# Sprint 5: Billing & Admin - Implementation Summary

**Version**: v0.5.0
**Completed**: February 2026
**Story Points**: 24
**Status**: ✅ Complete

---

## Executive Summary

Sprint 5 adds monetization, observability, and API protection to TenantForge. The system now supports Stripe subscriptions, logs all security-relevant actions, and enforces plan-based rate limits.

---

## What Was Built

### Phase 1: Stripe Integration (15 points)

**TF-037: Stripe Setup** ✅

- Installed Stripe SDK v14.0.0
- Created `config/stripe.ts` with API client
- Created `services/stripe.service.ts` with customer and subscription management
- Integrated Stripe customer creation into workspace lifecycle
- Updated environment configuration

**TF-038: Checkout Session** ✅

- Created billing controller and routes
- Built `POST /workspaces/:slug/billing/checkout` endpoint
- Returns Stripe Checkout URL for subscription signup
- Requires OWNER role

**TF-039: Webhook Handler** ✅

- Created webhook controller with signature verification
- Handles 5 event types:
  - `checkout.session.completed` - Activates subscription
  - `invoice.paid` - Confirms payment
  - `invoice.payment_failed` - Logs failure
  - `customer.subscription.updated` - Updates plan
  - `customer.subscription.deleted` - Downgrades to FREE
- Implements idempotency using Redis (24h TTL)
- Updates workspace plan automatically

**TF-040: Billing Portal** ✅

- Built `POST /workspaces/:slug/billing/portal` endpoint
- Returns Stripe Customer Portal URL
- Allows self-service subscription management

**TF-041: Billing Info** ✅

- Built `GET /workspaces/:slug/billing` endpoint
- Returns current plan, subscription status, and billing period
- Requires ADMIN+ role

### Phase 2: Audit Logging (6 points)

**TF-042: Audit Service** ✅

- Created non-blocking audit service with in-memory batching
- Auto-flushes on 100 events or 5-second interval
- Uses `setImmediate` for async writes
- Created audit repository for batch inserts
- Defined 19 audit action constants

**TF-043: Integrate Audit Logging** ✅

- Added audit logging to auth service (register, login, login_failed)
- Added audit logging to workspace service (created, updated, deleted)
- Added audit logging to invitation service (invited, joined)
- Added audit logging to member service (role_changed, removed)
- Added audit logging to webhook handler (subscription events)
- Created audit middleware for request context (IP, user agent)

### Phase 3: Rate Limiting (3 points)

**TF-044: Rate Limiting** ✅

- Installed `rate-limiter-flexible` v3.0.0
- Created rate limit service with Redis backend
- Implemented 3 rate limiters:
  - **Global**: 1,000 requests/60s per IP
  - **Auth**: 5 requests/900s per IP (prevents brute force)
  - **Workspace**: Plan-based daily limits (FREE: 1,000, PRO: 50,000, ENTERPRISE: 1,000,000)
- Created rate limit middleware with proper error handling
- Returns 429 with `Retry-After` header on limit exceeded
- Sets rate limit headers on all responses

---

## Files Created (14 files)

```
apps/api/src/
├── config/
│   └── stripe.ts                    # Stripe SDK initialization
├── controllers/
│   ├── billing.controller.ts        # Checkout, portal, billing info
│   └── webhook.controller.ts        # Stripe webhook handler
├── lib/
│   └── redis.ts                     # Redis client for rate limiting
├── middleware/
│   ├── audit.middleware.ts          # Request context for audit logs
│   └── rate-limit.middleware.ts     # Rate limiting middleware
├── repositories/
│   └── audit.repository.ts          # Audit log database operations
├── routes/
│   ├── billing.routes.ts            # Billing endpoints
│   └── webhook.routes.ts            # Webhook endpoint
├── schemas/
│   └── billing.schema.ts            # Zod validation schemas
├── services/
│   ├── audit.service.ts             # Audit logging with batching
│   ├── rate-limit.service.ts        # Rate limiting service
│   └── stripe.service.ts            # Stripe integration
└── types/
    └── audit.types.ts               # Audit event types and actions
```

## Files Modified (13 files)

- `app.ts` - Added audit and rate limit middleware
- `config/env.ts` - Added Stripe and rate limit config
- `routes/index.ts` - Mounted billing and webhook routes
- `routes/billing.routes.ts` - Added `mergeParams: true` for nested route params
- `types/express.d.ts` - Added `auditContext` to Request type
- `repositories/workspace.repository.ts` - Added `findByStripeSubscriptionId`
- `services/workspace.service.ts` - Integrated Stripe customer creation, audit logging
- `services/auth.service.ts` - Added audit logging
- `services/invitation.service.ts` - Added audit logging
- `services/member.service.ts` - Added audit logging
- `.env.example` - Added Stripe and rate limit variables
- `docker/Dockerfile.api` - Added OpenSSL dependencies for Prisma
- `docker/docker-compose.yml` - Added env_file for proper environment loading

---

## API Endpoints

| Method | Endpoint                             | Auth      | Role   | Description             |
| ------ | ------------------------------------ | --------- | ------ | ----------------------- |
| POST   | `/workspaces/:slug/billing/checkout` | JWT       | OWNER  | Create checkout session |
| POST   | `/workspaces/:slug/billing/portal`   | JWT       | OWNER  | Create portal session   |
| GET    | `/workspaces/:slug/billing`          | JWT       | ADMIN+ | Get billing info        |
| POST   | `/webhooks/stripe`                   | Signature | -      | Stripe webhook handler  |

---

## Environment Variables

Add to `.env`:

```bash
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx

# Rate Limiting (Optional)
RATE_LIMIT_GLOBAL_POINTS=1000
RATE_LIMIT_GLOBAL_DURATION=60
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
```

---

## Testing

### Unit Tests

All 274 existing tests pass. No regressions.

### End-to-End Verification ✅

Comprehensive E2E testing completed on February 5, 2026:

**Authentication Flow**:

- ✅ User registration with email verification
- ✅ Login with JWT token generation
- ✅ Token refresh flow

**Multi-Tenancy**:

- ✅ Workspace creation with automatic Stripe customer
- ✅ Workspace isolation (non-members get 404)
- ✅ Workspace CRUD operations
- ✅ Password confirmation for deletion

**Team Management**:

- ✅ Send/accept/revoke invitations
- ✅ Member role updates (OWNER can promote all levels)
- ✅ Member removal
- ✅ Leave workspace
- ✅ Ownership transfer (requires password confirmation)

**Billing/Stripe**:

- ✅ Automatic Stripe customer creation on workspace creation
- ✅ Get billing info (plan, subscription status)
- ✅ Create Customer Portal sessions
- ✅ Create Checkout sessions (PRO and ENTERPRISE)
- ✅ RBAC enforcement (only OWNER can modify billing)

**Security**:

- ✅ RBAC enforcement at all levels
- ✅ Password confirmation for destructive operations
- ✅ Workspace enumeration prevention (404 for non-members)

### Stripe Testing

Use Stripe test mode:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

### Rate Limiting Testing

```bash
# Test global rate limit
for i in {1..1001}; do curl http://localhost:3001/health; done

# Test auth rate limit
for i in {1..6}; do curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'; done
```

---

## Stripe Setup Instructions

1. **Create Stripe account** at https://dashboard.stripe.com
2. **Create products**:
   - Free (no product needed)
   - Pro - $29/month recurring
   - Enterprise - $99/month recurring
3. **Copy price IDs** to `.env`
4. **Configure Customer Portal**:
   - Enable subscription cancellation
   - Enable payment method updates
5. **Set up webhook**:
   - URL: `https://your-domain.com/api/v1/webhooks/stripe`
   - Events: Select all subscription and invoice events
   - Copy webhook secret to `.env`

---

## Audit Log Actions

The system logs these actions:

**Authentication**:

- `user.registered`
- `user.login`
- `user.logout`
- `user.login_failed`

**Workspaces**:

- `workspace.created`
- `workspace.updated`
- `workspace.deleted`

**Team Management**:

- `member.invited`
- `member.joined`
- `member.role_changed`
- `member.removed`
- `ownership.transferred`

**Billing**:

- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `payment.failed`

**Security**:

- `rate_limit.exceeded`

Query audit logs:

```typescript
const logs = await auditRepository.findByWorkspace(workspaceId, {
  skip: 0,
  take: 100,
});
```

---

## Rate Limit Tiers

| Plan       | Daily API Calls | Monthly Cost |
| ---------- | --------------- | ------------ |
| FREE       | 1,000           | $0           |
| PRO        | 50,000          | $29          |
| ENTERPRISE | 1,000,000       | $99          |

Additional limiters:

- **Global**: 1,000 requests/minute per IP
- **Auth**: 5 attempts/15 minutes per IP

---

## Technical Notes

### Audit Service Performance

- Non-blocking writes using `setImmediate`
- In-memory buffer reduces database load
- Auto-flush prevents data loss
- Graceful shutdown flushes remaining events

### Rate Limiting Strategy

- Redis-backed for distributed deployment
- Plan-aware workspace limits
- Fails open on Redis errors (logs warning)
- Returns standard rate limit headers

### Webhook Security

- Signature verification prevents spoofing
- Idempotency prevents duplicate processing
- Raw body parsing required for signature check

---

## Known Limitations

1. **Audit logs don't capture failures**: Only successful operations logged
2. **No audit log UI**: Query via database only
3. **Rate limits not configurable per workspace**: Uses plan defaults
4. **No usage analytics UI**: Check Redis directly

---

## Next Steps (Sprint 6)

1. Build frontend UI pages
2. Add usage analytics dashboard
3. Create audit log viewer
4. Add notification system for failed payments
5. Implement plan upgrade prompts

---

## Dependencies Added

```json
{
  "stripe": "^14.0.0",
  "rate-limiter-flexible": "^3.0.0"
}
```

---

## Migration Notes

No database migrations required. The `AuditLog` model was already defined in the Prisma schema from Sprint 1.

---

_Sprint 5 complete. TenantForge now supports subscriptions, audit logging, and rate limiting._
