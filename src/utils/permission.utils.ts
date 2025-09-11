import { PERMISSIONS } from '@/lib/permissions';

export interface Permission {
  module: string;
  action: string;
  resource?: string;
}

export interface UserPermissions {
  permissions: string[];
  role: string;
}

export const checkPermission = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
};

export const checkMultiplePermissions = (
  userPermissions: string[],
  requiredPermissions: string[],
  requireAll = false
): boolean => {
  if (requireAll) {
    return requiredPermissions.every(permission => 
      checkPermission(userPermissions, permission)
    );
  }
  return requiredPermissions.some(permission => 
    checkPermission(userPermissions, permission)
  );
};

export const getModulePermissions = (
  userPermissions: string[],
  module: keyof typeof PERMISSIONS
): string[] => {
  const modulePerms = Object.values(PERMISSIONS[module] as Record<string, string>);
  return userPermissions.filter(permission => 
    modulePerms.includes(permission)
  );
};

export const hasAnyPermission = (
  userPermissions: string[],
  permissions: string[]
): boolean => {
  return permissions.some(permission => 
    checkPermission(userPermissions, permission)
  );
};
