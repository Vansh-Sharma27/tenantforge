# TenantForge API Documentation

**Version**: v0.4.0
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
  "slug": "acme-corp" // optional, auto-generated from name
}
```

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
      "id": "ws_123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "plan": "FREE",
      "role": "OWNER",
      "memberCount": 5
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
    "settings": {}
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
  "role": "MEMBER" // ADMIN, MEMBER, or VIEWER
}
```

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

- `409 Conflict` - User already member or invitation pending
- `403 Forbidden` - Insufficient permissions

### List Pending Invitations

**GET** `/workspaces/:slug/invitations`

List pending invitations for workspace.

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

Revoke a pending invitation.

**Auth**: Required (ADMIN or OWNER)

**Response:** `200 OK`

### Get Invitation Details

**GET** `/invitations/:token`

Get invitation details (for registration flow).

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

**Errors:**

- `404 Not Found` - Invalid token
- `400 Bad Request` - Expired token

### Accept Invitation

**POST** `/invitations/:token/accept`

Accept workspace invitation.

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

**Errors:**

- `400 Bad Request` - Expired, revoked, or already accepted
- `409 Conflict` - Already workspace member

---

## Members

### List Members

**GET** `/workspaces/:slug/members?page=1&limit=20&search=john&role=MEMBER`

List workspace members.

**Auth**: Required (any member)

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string, optional) - search name or email
- `role` (string, optional) - filter by role

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

Update member's role.

**Auth**: Required (ADMIN or OWNER)

**Request:**

```json
{
  "role": "ADMIN" // ADMIN, MEMBER, or VIEWER
}
```

**Response:** `200 OK`

**Rules:**

- ADMIN cannot modify OWNER
- ADMIN cannot promote to OWNER
- ADMIN cannot modify other ADMINs
- Cannot change OWNER role (use transfer endpoint)

**Errors:**

- `403 Forbidden` - Insufficient permissions or rule violation
- `404 Not Found` - Member not found

### Remove Member

**DELETE** `/workspaces/:slug/members/:id`

Remove member from workspace.

**Auth**: Required (ADMIN or OWNER)

**Response:** `200 OK`

**Rules:**

- Cannot remove OWNER
- ADMIN cannot remove other ADMINs

**Errors:**

- `403 Forbidden` - Insufficient permissions or rule violation

### Leave Workspace

**POST** `/workspaces/:slug/leave`

Leave workspace (any member except OWNER).

**Auth**: Required

**Response:** `200 OK`

**Errors:**

- `403 Forbidden` - OWNER cannot leave (must transfer first)

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

**Response:** `200 OK`

**Process:**

- Verifies current owner's password
- Target becomes OWNER
- Current owner becomes ADMIN
- Both parties receive email notification

**Errors:**

- `401 Unauthorized` - Invalid password
- `403 Forbidden` - Not OWNER
- `404 Not Found` - Target not workspace member

---

## Error Responses

All errors follow RFC 7807 Problem Details format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Status Codes

- `400 Bad Request` - Invalid input or business rule violation
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found or user not member
- `409 Conflict` - Resource conflict (duplicate email, etc.)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Rate limits apply per IP address:

- Authentication endpoints: 5 requests/15 minutes
- Other endpoints: 100 requests/minute

Headers returned:

- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## Testing

Use tools like cURL, Postman, or Thunder Client:

**Example: Create workspace with authentication**

```bash
# 1. Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'

# 2. Create workspace (use access token from step 1)
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"My Company"}'

# 3. Invite member
curl -X POST http://localhost:3001/api/v1/workspaces/my-company/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"email":"member@example.com","role":"MEMBER"}'
```

---

_Last Updated: February 2026_
_API Version: v0.4.0_
