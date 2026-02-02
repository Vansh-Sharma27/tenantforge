// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export interface WorkspaceSettings {
  timezone?: string;
  dateFormat?: string;
  defaultRole?: Role;
}

// Membership types
export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  joinedAt: Date;
}

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

// Invitation types
export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  traceId?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  sid: string; // Session ID
}
