# TenantForge

A production-ready multi-tenant SaaS starter template built with TypeScript.

**Current Version**: v0.2.0 (Sprint 2: Authentication Complete)
**Status**: 🚧 In Development | ✅ Sprint 1 & 2 Complete

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

### Testing Authentication

Register a new user:

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
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

### ✅ Implemented (Sprint 1 & 2)

- **Foundation**: Monorepo with Turborepo, Docker Compose, TypeScript, Prisma
- **Database**: PostgreSQL schema with 8 models (User, Session, Workspace, etc.)
- **Authentication**:
  - User registration with email verification
  - JWT authentication with RS256 (access + refresh tokens)
  - Password reset flow
  - Token refresh with rotation
  - Auth middleware (requireAuth, optionalAuth)
- **Security**:
  - Argon2id password hashing
  - Single-use refresh token rotation
  - Session tracking with IP and user agent
  - Generic error messages prevent user enumeration
- **Testing**: 60 tests with 94% coverage

### 🚧 In Progress (Sprint 3)

- **Multi-tenancy**: Row-level workspace isolation
- **RBAC**: Role-based access control (Owner, Admin, Member, Viewer)
- **OAuth**: Google and GitHub authentication

### 📋 Planned (Sprint 4-6)

- **Team Management**: Invitations, member management
- **Billing**: Stripe integration with subscription plans
- **Audit Logging**: Track all significant actions
- **Rate Limiting**: Redis-based per-tenant limits
- **UI**: Core pages (login, dashboard, settings, members, billing)

## Environment Variables

See `.env.example` for all available configuration options.

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

Full API documentation will be available at `/docs` in a future sprint.

## License

MIT
