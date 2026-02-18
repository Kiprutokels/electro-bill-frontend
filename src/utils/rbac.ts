import Jobs from "@/pages/Jobs";

export type AppRole =
  | "ADMIN"
  | "SALES"
  | "SUPPORT"
  | "CRM_MANAGER"
  | "TECHNICIAN"
  | "FINANCE"
  | "MANAGER";

export function getRoleName(user: any): AppRole {
  const role = user?.role?.name ?? user?.role ?? "ADMIN";
  return role as AppRole;
}

export function getDefaultRouteForRole(role: AppRole) {
  switch (role) {
    case "TECHNICIAN":
      return "/technician/jobs";
    case "SALES":
      return "/crm/my-subscriptions";
    case "SUPPORT":
      return "/tickets";
    case "CRM_MANAGER":
      return "/crm/dashboard";
    case "FINANCE":
      return "/dashboard";
    case "MANAGER":
      return "/dashboard";
    case "ADMIN":
    default:
      return "/dashboard";
  }
}

/**
 * Hard role menu hiding (independent of permission).
 * - You can still keep permissions, this is the extra "industry standard" UX layer.
 */
export function isMenuItemAllowedForRole(role: AppRole, itemKey: string) {
  if (role === "ADMIN") return true;

  const deny: Record<AppRole, Set<string>> = {
    SALES: new Set([
      "dashboard",
      "inventory",
      "products",
      "transactions",
      "jobs",
      "requisitions",
      "advance_requests",
      "inspections",
      "settings",
      "manager_tools",
      "departments",
      "users",
      "roles",
      "processing_fees",
      "migration_upload",
      "campaigns", // if SALES should not see campaigns
    ]),
    SUPPORT: new Set([
      "dashboard",
      "settings",
      "manager_tools",
      "departments",
      "users",
      "roles",
      "processing_fees",
      "migration_upload",
      "campaigns", // optional
      "crm_manager_tools",
    ]),
    CRM_MANAGER: new Set([
      // CRM_MANAGER is allowed manager stuff, but hide sales/inventory heavy items if you want:
      // "inventory", "products", ...
    ]),
    FINANCE: new Set([
      "dashboard",
      "settings",
      "manager_tools",
      "departments",
      "users",
      "roles",
      "migration_upload",
      "crm_followups",
      "crm_interactions",
      "crm_my_portfolio",
      "campaigns",
    ]),
    TECHNICIAN: new Set(["dashboard"]),
    MANAGER: new Set([]),
    ADMIN: new Set([]),
  };

  const denied = deny[role] ?? new Set<string>();
  return !denied.has(itemKey);
}