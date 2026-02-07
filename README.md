# TenantForge

A production-ready multi-tenant SaaS starter template built with TypeScript.

**Current Version**: v0.5.0 (Sprint 5: Billing & Admin Complete)
**Status**: 🚧 In Development | ✅ Sprint 1, 2, 3, 4 & 5 Complete

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Vansh-Sharma27/tenantforge.git
   cd tenantforge
   ```

2. **Copy environment variables**

   ```bash
   cp .env.example .env
   ```

3. **Generate RSA keys for JWT**

   ```bash
   cd apps/api
   pnpm generate:keys
   cd ../..
   ```

4. **Start with Docker (recommended)**

   ```bash
   docker compose -f docker/docker-compose.yml up
   ```

   Or for local development without Docker:

   ```bash
   # Start PostgreSQL and Redis
   docker compose -f docker/docker-compose.yml up db redis -d

   # Install dependencies
   pnpm install

   # Run database migrations
   pnpm db:push

   # Generate JWT keys
   cd apps/api && pnpm generate:keys && cd ../..

   # Start development servers
   pnpm dev
   ```

5. **Access the application**
   - API: http://localhost:3001
   - Web: http://localhost:3000
   - Health Check: http://localhost:3001/health

### Testing the API

**Register a user:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Create a workspace:**

```bash
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "My Company"
  }'
```

## Project Structure

```
tenantforge/
├── apps/
│   ├── api/           # Express.js API server
│   └── web/           # Next.js frontend
├── packages/
│   └── shared/        # Shared types & constants
├── docker/            # Docker configuration
└── docs/              # Documentation
```

## Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # Start API only
pnpm dev:web          # Start web only

# Authentication
pnpm generate:keys    # Generate RSA keys for JWT (run from apps/api)

# Database
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage

# Linting
pnpm lint             # Check linting
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
```

## Features

### ✅ Implemented (Sprint 1-5)

- **Foundation**: Monorepo with Turborepo, Docker Compose, TypeScript, Prisma
- **Database**: PostgreSQL schema with 8 models (User, Session, Workspace, etc.)
- **Authentication**:
  - User registration with email verification
  - JWT authentication with RS256 (access + refresh tokens)
  - Password reset flow
  - Token refresh with rotation
  - Auth middleware (requireAuth, optionalAuth)
- **Multi-Tenancy**:
  - Workspace creation and management
  - Tenant isolation middleware
  - Role-based access control (OWNER, ADMIN, MEMBER, VIEWER)
  - Soft delete with 30-day grace period
  - Workspace slug generation with collision handling
- **Team Management** (NEW in v0.4.0):
  - Invite members via email
  - Role-based permissions (OWNER, ADMIN, MEMBER, VIEWER)
  - Member management (update roles, remove members)
  - Ownership transfer
  - Email service with Resend and BullMQ
  - Invitation expiry and token validation
- **Security**:
  - Argon2id password hashing
  - Single-use refresh token rotation
  - Session tracking with IP and user agent
  - Generic error messages prevent user enumeration
  - Non-member access returns 404 (prevents workspace enumeration)
  - Password confirmation required for destructive operations
- **Billing** (NEW in v0.5.0):
  - Stripe integration with subscription plans (FREE, PRO, ENTERPRISE)
  - Checkout session creation
  - Customer Portal for self-service management
  - Webhook handler for subscription events
  - Automatic plan upgrades and downgrades
- **Audit Logging** (NEW in v0.5.0):
  - Non-blocking audit service with batching
  - Tracks 19 action types (auth, workspace, team, billing, security)
  - Captures IP address and user agent
  - Batch writes for performance
- **Rate Limiting** (NEW in v0.5.0):
  - Redis-backed distributed rate limiting
  - Global rate limit (1,000 requests/min per IP)
  - Auth rate limit (5 attempts/15min per IP)
  - Plan-based workspace limits (FREE: 1k/day, PRO: 50k/day, ENTERPRISE: 1M/day)
- **Testing**: 274 unit tests + comprehensive E2E testing (100% pass rate)
- **Docker**: Production-ready Docker Compose setup with health checks

### 📋 Planned (Sprint 6)

- **UI**: Core pages (login, dashboard, settings, members, billing)
- **Notifications**: Failed payment alerts
- **Usage Analytics**: API usage dashboard
- **Audit Log Viewer**: UI for viewing audit logs

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

**Required:**

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: Generate with `openssl rand -base64 64`

**Email Service (Sprint 4):**

- `RESEND_API_KEY`: Get from [resend.com/api-keys](https://resend.com/api-keys)
- `EMAIL_FROM`: Sender address for system emails
- `EMAIL_ENABLED`: Set to `true` in production
- `FRONTEND_URL`: Base URL for email links (invitations, verification)

**Billing (Sprint 5):**

- `STRIPE_SECRET_KEY`: Get from [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret
- `STRIPE_PRICE_PRO`: Price ID for Pro plan
- `STRIPE_PRICE_ENTERPRISE`: Price ID for Enterprise plan

**Optional:**

- OAuth provider credentials (GitHub, Google)
- Rate limiting configuration (see `.env.example`)

See `.env.example` for complete configuration options.

## API Documentation

### Authentication Endpoints

All authentication endpoints are prefixed with `/api/v1/auth`:

| Method | Endpoint           | Description               | Auth Required |
| ------ | ------------------ | ------------------------- | ------------- |
| POST   | `/register`        | Create new user account   | No            |
| POST   | `/verify-email`    | Verify email with token   | No            |
| POST   | `/login`           | Authenticate user         | No            |
| POST   | `/refresh`         | Refresh access token      | No            |
| POST   | `/forgot-password` | Request password reset    | No            |
| POST   | `/reset-password`  | Reset password with token | No            |

### Workspace Endpoints

All workspace endpoints are prefixed with `/api/v1/workspaces`:

| Method | Endpoint | Description           | Auth Required | Role Required |
| ------ | -------- | --------------------- | ------------- | ------------- |
| POST   | `/`      | Create workspace      | Yes           | -             |
| GET    | `/`      | List user workspaces  | Yes           | -             |
| GET    | `/:slug` | Get workspace details | Yes           | MEMBER+       |
| PATCH  | `/:slug` | Update workspace      | Yes           | ADMIN+        |
| DELETE | `/:slug` | Delete workspace      | Yes           | OWNER         |

### Member Endpoints (Sprint 4)

Member management endpoints:

| Method | Endpoint                        | Description            | Auth Required | Role Required |
| ------ | ------------------------------- | ---------------------- | ------------- | ------------- |
| GET    | `/workspaces/:slug/members`     | List workspace members | Yes           | MEMBER+       |
| PATCH  | `/workspaces/:slug/members/:id` | Update member role     | Yes           | ADMIN+        |
| DELETE | `/workspaces/:slug/members/:id` | Remove member          | Yes           | ADMIN+        |
| POST   | `/workspaces/:slug/leave`       | Leave workspace        | Yes           | MEMBER+       |
| POST   | `/workspaces/:slug/transfer`    | Transfer ownership     | Yes           | OWNER         |

### Invitation Endpoints (Sprint 4)

Invitation management endpoints:

| Method | Endpoint                            | Description            | Auth Required | Role Required |
| ------ | ----------------------------------- | ---------------------- | ------------- | ------------- |
| POST   | `/workspaces/:slug/invitations`     | Send invitation        | Yes           | ADMIN+        |
| GET    | `/workspaces/:slug/invitations`     | List pending invites   | Yes           | ADMIN+        |
| DELETE | `/workspaces/:slug/invitations/:id` | Revoke invitation      | Yes           | ADMIN+        |
| GET    | `/invitations/:token`               | Get invitation details | No            | -             |
| POST   | `/invitations/:token/accept`        | Accept invitation      | Optional      | -             |

### Billing Endpoints (Sprint 5)

All billing endpoints are prefixed with `/api/v1/workspaces/:slug/billing`:

| Method | Endpoint    | Description             | Auth Required | Role Required |
| ------ | ----------- | ----------------------- | ------------- | ------------- |
| POST   | `/checkout` | Create checkout session | Yes           | OWNER         |
| POST   | `/portal`   | Create portal session   | Yes           | OWNER         |
| GET    | `/`         | Get billing info        | Yes           | ADMIN+        |

### Webhook Endpoints (Sprint 5)

| Method | Endpoint           | Description           | Auth Required |
| ------ | ------------------ | --------------------- | ------------- |
| POST   | `/webhooks/stripe` | Stripe webhook events | Signature     |

Full API documentation will be available at `/docs` in a future sprint.

## License

MIT
