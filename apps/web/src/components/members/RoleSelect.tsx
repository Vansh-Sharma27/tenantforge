"use client";

import type { Role } from "@tenantforge/shared";
import { isRoleHigher } from "@tenantforge/shared/constants/roles";

interface RoleSelectProps {
  value: Role;
  actorRole: Role;
  targetRole: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

const ALL_ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export function RoleSelect({ value, actorRole, targetRole, onChange, disabled }: RoleSelectProps) {
  // Cannot modify OWNER or someone with equal/higher role (unless you're OWNER)
  const canModify =
    actorRole === "OWNER" ? targetRole !== "OWNER" : isRoleHigher(actorRole, targetRole);

  // Available roles: roles lower than actor (or equal for OWNER)
  const availableRoles = ALL_ROLES.filter((role) => {
    if (role === "OWNER") return false; // Can never assign OWNER via dropdown
    if (actorRole === "OWNER") return true;
    return isRoleHigher(actorRole, role);
  });

  if (!canModify || disabled) {
    return <span className="text-small text-gray-600 font-medium">{value}</span>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
      className="text-small border border-gray-200 rounded-md px-2 py-1 bg-white cursor-pointer transition-default focus:border-accent focus:ring-1 focus:ring-accent"
    >
      {availableRoles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
