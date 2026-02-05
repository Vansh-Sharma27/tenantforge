# TenantForge

A production-ready multi-tenant SaaS starter template built with TypeScript.

**Current Version**: v0.4.0 (Sprint 4: Team Management Complete)
**Status**: 🚧 In Development | ✅ Sprint 1, 2, 3 & 4 Complete

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
   git clone https://github.com/yourusername/tenantforge.git
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

### ✅ Implemented (Sprint 1, 2, 3 & 4)

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
- **Testing**: 274 tests with high coverage (100% pass rate)

### 📋 Planned (Sprint 5-6)

- **Billing**: Stripe integration with subscription plans
- **Audit Logging**: Track all significant actions
- **Rate Limiting**: Redis-based per-tenant limits
- **UI**: Core pages (login, dashboard, settings, members, billing)

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

**Optional:**

- Stripe keys for billing (Sprint 5)
- OAuth provider credentials (GitHub, Google)

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

All member endpoints are prefixed with `/api/v1/workspaces/:slug/members`:

| Method | Endpoint                     | Description            | Auth Required | Role Required |
| ------ | ---------------------------- | ---------------------- | ------------- | ------------- |
| POST   | `/invite`                    | Invite member by email | Yes           | ADMIN+        |
| GET    | `/`                          | List workspace members | Yes           | MEMBER+       |
| GET    | `/:memberId`                 | Get member details     | Yes           | MEMBER+       |
| PATCH  | `/:memberId/role`            | Update member role     | Yes           | ADMIN+        |
| DELETE | `/:memberId`                 | Remove member          | Yes           | ADMIN+        |
| POST   | `/:memberId/transfer`        | Transfer ownership     | Yes           | OWNER         |
| POST   | `/invitations/:token/accept` | Accept invitation      | Yes           | -             |

Full API documentation will be available at `/docs` in a future sprint.

## License

MIT
