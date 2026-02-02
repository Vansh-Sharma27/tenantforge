# TenantForge

A production-ready multi-tenant SaaS starter template built with TypeScript.

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

3. **Start with Docker (recommended)**
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
   pnpm db:migrate

   # Seed the database
   pnpm db:seed

   # Start development servers
   pnpm dev
   ```

4. **Access the application**
   - API: http://localhost:3001
   - Web: http://localhost:3000
   - Health Check: http://localhost:3001/health

### Test Credentials

After seeding the database:

- Email: `test@example.com`
- Password: `Password123!`

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

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
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

- **Authentication**: JWT with refresh token rotation
- **Multi-tenancy**: Row-level workspace isolation
- **Team Management**: Invitations, roles (Owner, Admin, Member, Viewer)
- **Billing**: Stripe integration (test mode)
- **Audit Logging**: Track all significant actions
- **Rate Limiting**: Redis-based per-tenant limits

## Environment Variables

See `.env.example` for all available configuration options.

## API Documentation

API documentation will be available at `/docs` once the server is running.

## License

MIT
