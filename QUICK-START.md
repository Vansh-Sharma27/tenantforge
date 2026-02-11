# TenantForge — Quick Start Guide

**Version**: v0.6.0-beta
**Status**: Sprints 1-5 Complete, Sprint 6 (Frontend) In Progress

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Stripe account (optional, for billing features)
- Resend account (optional, for email delivery)

## 1. Clone and Setup

```bash
git clone https://github.com/Vansh-Sharma27/tenantforge.git
cd tenantforge

# Copy environment template
cp .env.example .env

# Edit .env with your keys (see Environment Variables below)
nano .env

# Install dependencies
pnpm install
```

## 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis containers
docker compose -f docker/docker-compose.yml up db redis -d

# Push database schema
pnpm db:push
```

## 3. Start Development Servers

```bash
# Start both API and frontend
pnpm dev
```

Or start them individually:

```bash
# Terminal 1 — API server (port 3001)
pnpm dev:api

# Terminal 2 — Next.js frontend (port 3000)
pnpm dev:web
```

## 4. Production Build

```bash
# Build all packages
pnpm build

# Start API (requires env vars in shell)
cd apps/api && node dist/index.js

# Start frontend
cd apps/web && npx next start
```

> **Note**: In production the API reads environment variables from the shell (no dotenv). Make sure all required variables are exported or set via your deployment platform.

## 5. Access the Application

| Service       | URL                          |
| ------------- | ---------------------------- |
| Frontend      | http://localhost:3000        |
| API           | http://localhost:3001        |
| Health Check  | http://localhost:3001/health |
| Prisma Studio | `pnpm db:studio` (port 5555) |

## Testing the API

### Register

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!", "name": "Test User"}'
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

### Create a Workspace

```bash
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name": "My Company"}'
```

### Get Billing Info

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/v1/workspaces/<SLUG>/billing
```

### Create Checkout Session

```bash
curl -X POST http://localhost:3001/api/v1/workspaces/<SLUG>/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"plan": "PRO"}'
```

## Available Commands

### Development

```bash
pnpm dev              # Start all services (API + frontend)
pnpm dev:api          # Start API only
pnpm dev:web          # Start frontend only
```

### Build

```bash
pnpm build            # Build all packages
```

### Database

```bash
pnpm db:push          # Push schema changes (development)
pnpm db:migrate       # Run migrations (production)
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Regenerate Prisma client
```

### Testing & Linting

```bash
pnpm test             # Run all tests
pnpm test:coverage    # Test with coverage
pnpm lint             # Check linting
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format code with Prettier
```

## Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tenantforge

# Redis
REDIS_URL=redis://localhost:6379

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

Optional (enable as needed):

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

# OAuth (optional)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

See `.env.example` for the complete list.

## Project Structure

```
tenantforge/
├── apps/
│   ├── api/                 # Express.js API
│   │   ├── src/
│   │   │   ├── config/      # Environment config
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Auth, RBAC, rate limiting, tenant
│   │   │   ├── schemas/     # Zod validation
│   │   │   ├── templates/   # Email templates
│   │   │   └── workers/     # BullMQ job processors
│   │   └── prisma/          # Database schema
│   │
│   └── web/                 # Next.js 14 frontend
│       └── src/
│           ├── app/(public)/ # Public pages (landing, auth)
│           ├── app/(app)/    # Protected pages (dashboard, workspace)
│           ├── components/   # Reusable components
│           ├── hooks/        # React Query hooks
│           ├── stores/       # Zustand stores
│           └── lib/          # API client, utilities
│
├── packages/shared/         # Shared types & constants
└── docker/                  # Docker configuration
```

## Troubleshooting

### Port already in use

```bash
# Find and kill process on a port
fuser -k 3000/tcp  # frontend
fuser -k 3001/tcp  # API
```

### Database connection issues

```bash
# Check Docker containers are running
docker compose -f docker/docker-compose.yml ps

# Restart infrastructure
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up db redis -d
```

### Prisma client issues

```bash
pnpm db:generate
```

### API env vars not loading

The API does not use dotenv. For local development, ensure your `.env` variables are loaded:

```bash
# Option 1: Use pnpm dev (handles it via tsx)
pnpm dev:api

# Option 2: Source manually then run
set -a && source apps/api/.env && set +a
cd apps/api && npx tsx watch src/index.ts
```

## Documentation

| File              | Description                              |
| ----------------- | ---------------------------------------- |
| `README.md`       | Full project documentation               |
| `QUICK-START.md`  | This guide                               |
| `apps/api/API.md` | Detailed API documentation with examples |
| `.env.example`    | All configuration options                |

---

**Version**: v0.6.0-beta
**Status**: Sprint 6 In Progress
