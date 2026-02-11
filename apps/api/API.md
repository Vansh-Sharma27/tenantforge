# TenantForge API Documentation

**Version**: v0.5.0
**Base URL**: `http://localhost:3001/api/v1`

---

## Authentication

All authenticated endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

**POST** `/auth/register`

Create a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false,
      "status": "PENDING"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### Login

**POST** `/auth/login`

Authenticate with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### Refresh Token

**POST** `/auth/refresh`

**Request:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK` — returns new access and refresh tokens.

### Forgot Password

**POST** `/auth/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK` — always returns success to prevent user enumeration.

### Reset Password

**POST** `/auth/reset-password`

**Request:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## Workspaces

### Create Workspace

**POST** `/workspaces`

Create a new workspace. Creator becomes OWNER.

**Auth**: Required

**Request:**

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}
```

`slug` is optional — auto-generated from name if omitted.

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "plan": "FREE"
    },
    "membership": {
      "role": "OWNER",
      "joinedAt": "2026-02-05T10:30:00Z"
    }
  }
}
```

### List Workspaces

**GET** `/workspaces?page=1&limit=20`

List all workspaces user belongs to.

**Auth**: Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "workspace": {
        "id": "ws_123",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "plan": "FREE"
      },
      "role": "OWNER",
      "joinedAt": "2026-02-05T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Get Workspace

**GET** `/workspaces/:slug`

Get workspace details.

**Auth**: Required (must be member)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ws_123",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "plan": "FREE",
    "memberCount": 5,
    "settings": {},
    "membership": {
      "role": "OWNER",
      "joinedAt": "2026-02-05T10:30:00Z"
    }
  }
}
```

### Update Workspace

**PATCH** `/workspaces/:slug`

Update workspace settings.

**Auth**: Required (ADMIN or OWNER)

**Request:**

```json
{
  "name": "Acme Corporation",
  "settings": {
    "timezone": "America/New_York"
  }
}
```

**Response:** `200 OK`

### Delete Workspace

**DELETE** `/workspaces/:slug`

Soft delete workspace (30-day grace period).

**Auth**: Required (OWNER only)

**Request:**

```json
{
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

---

## Team Management

### Send Invitation

**POST** `/workspaces/:slug/invitations`

Invite user to workspace via email.

**Auth**: Required (ADMIN or OWNER)

**Request:**

```json
{
  "email": "newmember@example.com",
  "role": "MEMBER"
}
```

Role options: `ADMIN`, `MEMBER`, `VIEWER`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "inv_123",
    "email": "newmember@example.com",
    "role": "MEMBER",
    "status": "PENDING",
    "expiresAt": "2026-02-12T10:30:00Z"
  }
}
```

**Errors:**

- `409 Conflict` — User already member or invitation pending
- `403 Forbidden` — Insufficient permissions

### List Pending Invitations

**GET** `/workspaces/:slug/invitations`

**Auth**: Required (ADMIN or OWNER)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123",
      "email": "newmember@example.com",
      "role": "MEMBER",
      "status": "PENDING",
      "invitedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2026-02-05T10:30:00Z",
      "expiresAt": "2026-02-12T10:30:00Z"
    }
  ]
}
```

### Revoke Invitation

**DELETE** `/workspaces/:slug/invitations/:id`

**Auth**: Required (ADMIN or OWNER)

**Response:** `200 OK`

### Get Invitation Details

**GET** `/invitations/:token`

**Auth**: Optional

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "email": "newmember@example.com",
    "workspace": {
      "name": "Acme Corp",
      "slug": "acme-corp"
    },
    "role": "MEMBER",
    "invitedBy": {
      "name": "John Doe"
    },
    "expiresAt": "2026-02-12T10:30:00Z"
  }
}
```

### Accept Invitation

**POST** `/invitations/:token/accept`

**Auth**: Optional (creates membership for authenticated users)

**Authenticated User Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_123",
      "name": "Acme Corp",
      "slug": "acme-corp"
    },
    "membership": {
      "role": "MEMBER",
      "joinedAt": "2026-02-05T10:30:00Z"
    }
  }
}
```

**Unauthenticated Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "requiresRegistration": true,
    "email": "newmember@example.com",
    "workspace": {
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  }
}
```

---

## Members

### List Members

**GET** `/workspaces/:slug/members?page=1&limit=20&search=john&role=MEMBER`

**Auth**: Required (any member)

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string, optional) — search name or email
- `role` (string, optional) — filter by role

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "mem_123",
      "user": {
        "id": "user_123",
        "email": "john@example.com",
        "name": "John Doe",
        "avatarUrl": null
      },
      "role": "OWNER",
      "joinedAt": "2026-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Update Member Role

**PATCH** `/workspaces/:slug/members/:id`

**Auth**: Required (ADMIN or OWNER)

**Request:**

```json
{
  "role": "ADMIN"
}
```

**Rules:**

- ADMIN cannot modify OWNER
- ADMIN cannot promote to OWNER
- ADMIN cannot modify other ADMINs
- Cannot change OWNER role (use transfer endpoint)

### Remove Member

**DELETE** `/workspaces/:slug/members/:id`

**Auth**: Required (ADMIN or OWNER)

**Rules:**

- Cannot remove OWNER
- ADMIN cannot remove other ADMINs

### Leave Workspace

**POST** `/workspaces/:slug/leave`

Leave workspace (any member except OWNER).

**Auth**: Required

**Errors:**

- `403 Forbidden` — OWNER cannot leave (must transfer first)

### Transfer Ownership

**POST** `/workspaces/:slug/transfer`

Transfer workspace ownership to another member.

**Auth**: Required (OWNER only)

**Request:**

```json
{
  "targetUserId": "user_456",
  "password": "SecurePass123!"
}
```

**Process:**

- Verifies current owner's password
- Target becomes OWNER
- Current owner becomes ADMIN
- Both parties receive email notification

---

## Billing

### Get Billing Info

**GET** `/workspaces/:slug/billing`

Get workspace billing and subscription status.

**Auth**: Required (ADMIN or OWNER)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "plan": "FREE",
    "subscription": null,
    "hasStripeCustomer": false
  }
}
```

With active subscription:

```json
{
  "success": true,
  "data": {
    "plan": "PRO",
    "subscription": {
      "status": "active",
      "currentPeriodEnd": "2026-03-11T00:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "hasStripeCustomer": true
  }
}
```

### Create Checkout Session

**POST** `/workspaces/:slug/billing/checkout`

Create a Stripe Checkout session for subscription upgrade.

**Auth**: Required (OWNER only)

**Request:**

```json
{
  "plan": "PRO"
}
```

Plan options: `PRO`, `ENTERPRISE`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/..."
  }
}
```

**Errors:**

- `400 Bad Request` — Stripe price not configured or workspace not set up for billing

### Create Portal Session

**POST** `/workspaces/:slug/billing/portal`

Create a Stripe Customer Portal session for self-service subscription management.

**Auth**: Required (OWNER only)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "portalUrl": "https://billing.stripe.com/p/session/..."
  }
}
```

### Stripe Webhooks

**POST** `/webhooks/stripe`

Handles Stripe webhook events. Requires webhook signature verification.

**Auth**: Stripe signature (`Stripe-Signature` header)

**Handled Events:**

- `checkout.session.completed` — Activates subscription
- `customer.subscription.updated` — Syncs plan changes
- `customer.subscription.deleted` — Downgrades to FREE
- `invoice.payment_failed` — Logs payment failure

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Status Codes

- `400 Bad Request` — Invalid input or business rule violation
- `401 Unauthorized` — Missing or invalid authentication
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found or user not member
- `409 Conflict` — Resource conflict (duplicate email, etc.)
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

---

## Rate Limiting

Rate limits apply per IP address:

| Scope                  | Limit              | Window     |
| ---------------------- | ------------------ | ---------- |
| Global                 | 1,000 requests     | 1 minute   |
| Auth endpoints         | 5 requests         | 15 minutes |
| Workspace (FREE)       | 1,000 requests     | 1 day      |
| Workspace (PRO)        | 50,000 requests    | 1 day      |
| Workspace (ENTERPRISE) | 1,000,000 requests | 1 day      |

Headers returned:

- `X-RateLimit-Limit` — Request limit
- `X-RateLimit-Remaining` — Remaining requests
- `X-RateLimit-Reset` — Reset timestamp

---

_Last Updated: February 2026_
_API Version: v0.5.0_
