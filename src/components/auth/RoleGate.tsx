import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRouteForRole, getRoleName, AppRole } from "@/utils/rbac";
import { Loader2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermissions?: string[]; // AND condition
};

export default function RoleGate({ children, allowedRoles, requiredPermissions }: Props) {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = getRoleName(user);

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const ok = requiredPermissions.every((p) => hasPermission(p));
    if (!ok) {
      return <Navigate to={getDefaultRouteForRole(role)} replace />;
    }
  }

  return <>{children}</>;
}