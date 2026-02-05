import { Role, UserStatus } from "@prisma/client";

/**
 * Member response with full user details
 */
export interface MemberResponse {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    status: UserStatus;
  };
  role: Role;
  joinedAt: Date;
}

/**
 * Compact member for lists and searches
 */
export interface MemberListItem {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  joinedAt: Date;
}

/**
 * Paginated member list response
 */
export interface PaginatedMembersResponse {
  members: MemberResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
