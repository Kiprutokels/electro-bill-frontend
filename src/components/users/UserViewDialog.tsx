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
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { User } from '@/api/services/users.service';
import { formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface UserViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
}

const UserViewDialog: React.FC<UserViewDialogProps> = ({
  open,
  onOpenChange,
  user,
  onEdit,
  onResetPassword,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  const getStatusBadge = () => {
    return user.isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        <UserCheck className="mr-1 h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <UserX className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const getRoleBadge = () => {
    const colors = {
      ADMIN: 'bg-red-500 hover:bg-red-600',
      MANAGER: 'bg-blue-500 hover:bg-blue-600',
      STAFF: 'bg-green-500 hover:bg-green-600',
    };
    
    return (
      <Badge className={colors[user.role.name as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600'}>
        <Shield className="mr-1 h-3 w-3" />
        {user.role.name}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>User Details</DialogTitle>
            <div className="flex gap-2">
              {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleStatus}
                  >
                    {user.isActive ? (
                      <><ToggleLeft className="mr-1 h-4 w-4" /> Deactivate</>
                    ) : (
                      <><ToggleRight className="mr-1 h-4 w-4" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetPassword}
                  >
                    <Key className="mr-1 h-4 w-4" />
                    Reset Password
                  </Button>
                  <Button size="sm" onClick={onEdit}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="flex gap-2">
                {getStatusBadge()}
                {getRoleBadge()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Full Name
                </div>
                <div className="font-medium text-lg">
                  {user.firstName} {user.lastName}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Hash className="mr-2 h-4 w-4" />
                  Username
                </div>
                <div className="font-medium">@{user.username}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{user.email}</div>
                  <div className="text-sm text-muted-foreground">Email Address</div>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{user.phone}</div>
                    <div className="text-sm text-muted-foreground">Phone Number</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Role & Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role & Permissions</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.role.name}</div>
                  {user.role.description && (
                    <div className="text-sm text-muted-foreground">
                      {user.role.description}
                    </div>
                  )}
                </div>
                {user.permissions && (
                  <Badge variant="outline" className="font-mono">
                    {user.permissions.length} permissions
                  </Badge>
                )}
              </div>

              {user.permissions && user.permissions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Assigned Permissions:</div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {user.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="text-xs p-2 bg-muted rounded flex items-center"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="truncate" title={permission.name}>
                          {permission.module}.{permission.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created Date
                </div>
                <div className="font-medium">{formatDate(user.createdAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last Updated
                </div>
                <div className="font-medium">{formatDate(user.updatedAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last Login
                </div>
                <div className="font-medium">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Hash className="mr-2 h-4 w-4" />
                  User ID
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {user.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewDialog;
