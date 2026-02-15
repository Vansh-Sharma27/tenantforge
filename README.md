# TenantForge

A production-ready multi-tenant SaaS starter template built with TypeScript. Skip months of boilerplate and ship your SaaS product faster.

**Current Version**: v0.6.0-beta (Sprint 6: Frontend In Progress)
**Status**: Sprints 1-5 Complete | Sprint 6 In Progress

## What You Get

TenantForge gives you a fully wired backend and a working frontend so you can focus on building your product, not auth flows and billing plumbing.

- **Authentication** — JWT (RS256), email verification, password reset
- **Multi-Tenancy** — Workspace isolation, slug-based routing, RBAC (OWNER/ADMIN/MEMBER/VIEWER)
- **Team Management** — Email invitations, role management, ownership transfer
- **Billing** — Stripe subscriptions, checkout, customer portal, webhooks
- **Audit Logging** — Non-blocking batched writes, 19 action types
- **Rate Limiting** — Redis-backed, per-IP and per-plan limits
- **Frontend** — Next.js 14 with landing page, auth pages, dashboard, workspace management

## Tech Stack

| Layer           | Technology                                   |
| --------------- | -------------------------------------------- |
| **Backend**     | Node.js, Express, TypeScript, Prisma         |
| **Frontend**    | Next.js 14 (App Router), React, Tailwind CSS |
| **Database**    | PostgreSQL 15                                |
| **Cache/Queue** | Redis 7, BullMQ                              |
| **Payments**    | Stripe                                       |
| **Email**       | Resend                                       |
| **Monorepo**    | pnpm + Turborepo                             |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/Vansh-Sharma27/tenantforge.git
   cd tenantforge
   cp .env.example .env
   pnpm install
   ```

   > **Note for pnpm 10+ users**: If prompted about ignored build scripts, run:
   >
   > ```bash
   > pnpm approve-builds
   > # Select argon2 and any other native dependencies
   > ```

2. **Start infrastructure**

   ```bash
   docker compose -f docker/docker-compose.yml up db redis -d
   ```

3. **Generate RSA keys** (required for JWT signing)

   ```bash
   cd apps/api && pnpm generate:keys
   ```

4. **Setup database**

   ```bash
   pnpm db:push
   ```

5. **Start development servers**

   ```bash
   # Start both API and frontend
   pnpm dev
   ```

   Or start them separately:

   ```bash
   # Terminal 1 — API (port 3001)
   pnpm dev:api

   # Terminal 2 — Frontend (port 3000)
   pnpm dev:web
   ```

6. **Access the application**
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

### Production Build

```bash
# Build all packages
pnpm build

# Start API (production)
cd apps/api && pnpm start

# Start frontend
cd apps/web && npx next start
```

> **Note**: The API requires environment variables to be set in the shell or via your deployment platform. See `.env.example` for all required variables.

## Project Structure

```
tenantforge/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Auth, RBAC, tenant, rate limiting
│   │   │   ├── schemas/     # Zod request validation
│   │   │   ├── templates/   # Email templates
│   │   │   ├── workers/     # BullMQ job processors
│   │   │   └── config/      # Environment and service config
│   │   └── prisma/          # Database schema & migrations
│   │
│   └── web/                 # Next.js 14 frontend
│       └── src/
│           ├── app/
│           │   ├── (public)/ # Landing, login, register, password reset
│           │   └── (app)/    # Dashboard, workspace pages (protected)
│           ├── components/   # UI components, forms, layout
│           ├── hooks/        # React Query hooks for API calls
│           ├── stores/       # Zustand state management
│           ├── providers/    # Auth and query providers
│           └── lib/          # API client, validators, utilities
│
├── packages/
│   └── shared/              # Types and constants (roles, plans)
│
└── docker/                  # Docker Compose configuration
```

## Available Scripts

```bash
# Development
pnpm dev              # Start all services (API + frontend)
pnpm dev:api          # Start API only
pnpm dev:web          # Start frontend only

# Setup
pnpm generate:keys    # Generate RSA keys for JWT signing (run once)

# Build
pnpm build            # Build all packages

# Database
pnpm db:push          # Push schema changes (development)
pnpm db:migrate       # Run migrations (production)
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage

# Linting
pnpm lint             # Check linting
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
```

## Frontend Pages

| Route                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| `/`                   | Landing page with feature showcase                 |
| `/login`              | Login with email/password                          |
| `/register`           | Account registration                               |
| `/forgot-password`    | Password reset request                             |
| `/reset-password`     | Password reset form                                |
| `/verify-email`       | Email verification                                 |
| `/dashboard`          | Workspace selector (redirects if single workspace) |
| `/w/:slug`            | Workspace dashboard                                |
| `/w/:slug/members`    | Member list, invite, role management               |
| `/w/:slug/settings`   | Workspace settings                                 |
| `/w/:slug/billing`    | Plan management (Stripe checkout/portal)           |
| `/w/:slug/audit`      | Audit log viewer                                   |
| `/invitations/:token` | Invitation acceptance                              |

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint           | Description    | Auth |
| ------ | ------------------ | -------------- | ---- |
| POST   | `/register`        | Create account | No   |
| POST   | `/login`           | Authenticate   | No   |
| POST   | `/refresh`         | Refresh token  | No   |
| POST   | `/verify-email`    | Verify email   | No   |
| POST   | `/forgot-password` | Request reset  | No   |
| POST   | `/reset-password`  | Reset password | No   |

### Workspaces (`/api/v1/workspaces`)

| Method | Endpoint | Description      | Role          |
| ------ | -------- | ---------------- | ------------- |
| POST   | `/`      | Create workspace | Authenticated |
| GET    | `/`      | List workspaces  | Authenticated |
| GET    | `/:slug` | Get workspace    | MEMBER+       |
| PATCH  | `/:slug` | Update workspace | ADMIN+        |
| DELETE | `/:slug` | Delete workspace | OWNER         |

### Members (`/api/v1/workspaces/:slug/members`)

| Method | Endpoint       | Description        | Role    |
| ------ | -------------- | ------------------ | ------- |
| GET    | `/`            | List members       | MEMBER+ |
| PATCH  | `/:id`         | Update role        | ADMIN+  |
| DELETE | `/:id`         | Remove member      | ADMIN+  |
| POST   | `/../leave`    | Leave workspace    | MEMBER+ |
| POST   | `/../transfer` | Transfer ownership | OWNER   |

### Invitations (`/api/v1/workspaces/:slug/invitations`)

| Method | Endpoint                     | Description       | Role     |
| ------ | ---------------------------- | ----------------- | -------- |
| POST   | `/`                          | Send invitation   | ADMIN+   |
| GET    | `/`                          | List pending      | ADMIN+   |
| DELETE | `/:id`                       | Revoke invitation | ADMIN+   |
| GET    | `/invitations/:token`        | Get details       | Public   |
| POST   | `/invitations/:token/accept` | Accept invite     | Optional |

### Billing (`/api/v1/workspaces/:slug/billing`)

| Method | Endpoint           | Description             | Role      |
| ------ | ------------------ | ----------------------- | --------- |
| GET    | `/`                | Get billing info        | ADMIN+    |
| POST   | `/checkout`        | Create checkout session | OWNER     |
| POST   | `/portal`          | Create portal session   | OWNER     |
| POST   | `/webhooks/stripe` | Stripe webhooks         | Signature |

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tenantforge

# Redis
REDIS_URL=redis://localhost:6379

# JWT (generate: openssl rand -base64 64)
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
```

Optional but recommended:

```bash
# Email (resend.com)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_ENABLED=true

# Stripe (dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

See `.env.example` for the full list including OAuth, rate limiting, and advanced configuration.

## Customization

TenantForge is a starting point. Key files to customize:

| What                | Where                                         |
| ------------------- | --------------------------------------------- |
| Plans & pricing     | `packages/shared/src/constants/plans.ts`      |
| Roles & permissions | `packages/shared/src/constants/roles.ts`      |
| Database schema     | `apps/api/prisma/schema.prisma`               |
| Email templates     | `apps/api/src/templates/`                     |
| Design tokens       | `apps/web/tailwind.config.js` + `globals.css` |
| Landing page        | `apps/web/src/components/landing/`            |

## License

MIT
