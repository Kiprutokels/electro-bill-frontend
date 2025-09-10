import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Key, 
  Calendar,
  Shield,
  Users,
  Hash
} from 'lucide-react';
import { Role } from '@/api/services/roles.service';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface RoleViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onEdit: () => void;
  onManagePermissions: () => void;
}

const RoleViewDialog: React.FC<RoleViewDialogProps> = ({
  open,
  onOpenChange,
  role,
  onEdit,
  onManagePermissions,
}) => {
  const { hasPermission } = useAuth();

  // Group permissions by module
  const groupedPermissions = role.permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, typeof role.permissions>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Role Details</DialogTitle>
            <div className="flex gap-2">
              {hasPermission(PERMISSIONS.PERMISSIONS_ASSIGN) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onManagePermissions}
                >
                  <Key className="mr-1 h-4 w-4" />
                  Manage Permissions
                </Button>
              )}
              {hasPermission(PERMISSIONS.ROLES_UPDATE) && (
                <Button size="sm" onClick={onEdit}>
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Shield className="mr-2 h-4 w-4" />
                  Role Name
                </div>
                <div className="font-medium text-lg">{role.name}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  Assigned Users
                </div>
                <div className="font-medium text-lg">{role.userCount}</div>
              </div>

              {role.description && (
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="text-sm p-3 bg-muted rounded-lg">
                    {role.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Permissions</h3>
              <Badge variant="outline" className="font-mono">
                {role.permissions.length} total
              </Badge>
            </div>

            {role.permissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No permissions assigned to this role.</p>
                {hasPermission(PERMISSIONS.PERMISSIONS_ASSIGN) && (
                  <Button
                    variant="outline"
                    onClick={onManagePermissions}
                    className="mt-2"
                  >
                    Assign Permissions
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium uppercase tracking-wide text-sm">
                        {module}
                      </h4>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {modulePermissions.length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modulePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{permission.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Meta Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Meta Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created Date
                </div>
                <div className="font-medium">{formatDate(role.createdAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last Updated
                </div>
                <div className="font-medium">{formatDate(role.updatedAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Hash className="mr-2 h-4 w-4" />
                  Role ID
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {role.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleViewDialog;
