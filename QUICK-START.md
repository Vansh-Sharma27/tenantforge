# TenantForge - Quick Start Guide

## Current Status

**Version**: v0.5.0
**Sprint Status**: Sprint 5 Complete (Billing & Admin)
**Next Sprint**: Sprint 6 - UI Polish & Launch

### Completed Features

- Foundation (Monorepo, Docker, Prisma)
- Authentication (JWT, email verification, password reset)
- Multi-Tenancy (workspace isolation, RBAC)
- Team Management (invitations, roles, ownership transfer)
- Billing (Stripe subscriptions, checkout, portal)
- Audit Logging & Rate Limiting

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Stripe account (for billing features)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/tenantforge.git
cd tenantforge

# Copy environment variables
cp .env.example .env

# Edit .env with your Stripe keys and other config
nano .env
```

### 2. Start with Docker (Recommended)

```bash
# Start all services
cd docker
docker compose up -d

# Run database migrations (inside API container)
docker exec tenantforge-api npx prisma migrate deploy

# Check health
curl http://localhost:3001/health
```

### 3. Access the Application

- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Web** (Sprint 6): http://localhost:3000

## Testing the API

### Register a User

```bash
cat > /tmp/register.json << 'EOF'
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "name": "Test User"
}
EOF

curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d @/tmp/register.json
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

### Create a Workspace

```bash
# Replace <TOKEN> with your access token from login
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name": "My Company"}'
```

### Test Billing

```bash
# Get billing info
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/v1/workspaces/<SLUG>/billing

# Create checkout session
curl -X POST http://localhost:3001/api/v1/workspaces/<SLUG>/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"priceId": "price_xxx"}'
```

## Available Commands

### Development

```bash
pnpm dev              # Start all services
pnpm dev:api          # Start API only
pnpm dev:web          # Start web only
```

### Database

```bash
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (dev only)
pnpm db:studio        # Open Prisma Studio
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:coverage    # Test with coverage
pnpm lint             # Check linting
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

# Stripe (from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx

# Email (from resend.com)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_ENABLED=false
```

## Project Structure

```
tenantforge/
├── apps/
│   ├── api/                 # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Auth, RBAC, rate limiting
│   │   │   └── config/      # Configuration
│   │   └── prisma/          # Database schema
│   └── web/                 # Next.js frontend (Sprint 6)
├── packages/
│   └── shared/              # Shared types & constants
└── docker/                  # Docker configuration
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/forgot-password` - Request reset
- `POST /api/v1/auth/reset-password` - Reset password

### Workspaces

- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces` - List workspaces
- `GET /api/v1/workspaces/:slug` - Get workspace
- `PATCH /api/v1/workspaces/:slug` - Update workspace
- `DELETE /api/v1/workspaces/:slug` - Delete workspace

### Members

- `GET /api/v1/workspaces/:slug/members` - List members
- `PATCH /api/v1/workspaces/:slug/members/:id` - Update role
- `DELETE /api/v1/workspaces/:slug/members/:id` - Remove member
- `POST /api/v1/workspaces/:slug/leave` - Leave workspace
- `POST /api/v1/workspaces/:slug/transfer` - Transfer ownership

### Invitations

- `POST /api/v1/workspaces/:slug/invitations` - Send invite
- `GET /api/v1/workspaces/:slug/invitations` - List invites
- `POST /api/v1/invitations/:token/accept` - Accept invite

### Billing

- `GET /api/v1/workspaces/:slug/billing` - Get billing info
- `POST /api/v1/workspaces/:slug/billing/checkout` - Create checkout
- `POST /api/v1/workspaces/:slug/billing/portal` - Create portal

## Troubleshooting

### Docker Issues

```bash
# Restart containers
cd docker
docker compose down
docker compose up -d

# Check logs
docker logs tenantforge-api --tail 50
```

### Database Issues

```bash
# Run migrations
docker exec tenantforge-api npx prisma migrate deploy

# Reset database (dev only)
docker exec tenantforge-api npx prisma migrate reset
```

### Prisma Client Issues

```bash
# Regenerate client
docker exec tenantforge-api npx prisma generate
```

## Documentation

- `README.md` - Full documentation
- `SPRINT-5-SUMMARY.md` - Latest sprint details
- `apps/api/API.md` - API documentation
- `.env.example` - All configuration options

---

**Version**: v0.5.0
**Status**: Sprint 5 Complete
**Next**: Sprint 6 - UI Polish & Launch
