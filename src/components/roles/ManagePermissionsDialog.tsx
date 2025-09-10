import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { rolesService, Role } from '@/api/services/roles.service';
import { permissionsService, Permission } from '@/api/services/permissions.service';
import { toast } from 'sonner';

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onPermissionsUpdated: (role: Role) => void;
}

const ManagePermissionsDialog: React.FC<ManagePermissionsDialogProps> = ({
  open,
  onOpenChange,
  role,
  onPermissionsUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load permissions when dialog opens
  useEffect(() => {
    if (open) {
      loadPermissions();
      setSelectedPermissionIds(role.permissions.map(p => p.id));
    }
  }, [open, role]);

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await permissionsService.getPermissions();
      setPermissions(response.groupedByModule);
    } catch (err: any) {
      toast.error('Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await rolesService.assignPermissions(role.id, {
        permissionIds: selectedPermissionIds,
      });

      // Fetch updated role
      const updatedRole = await rolesService.getRoleById(role.id);
      onPermissionsUpdated(updatedRole);
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update permissions';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setSelectedPermissionIds(prev =>
      checked
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId)
    );
  };

  const handleModuleToggle = (modulePermissions: Permission[], checked: boolean) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    setSelectedPermissionIds(prev =>
      checked
        ? [...new Set([...prev, ...modulePermissionIds])]
        : prev.filter(id => !modulePermissionIds.includes(id))
    );
  };

  const isModuleSelected = (modulePermissions: Permission[]): boolean => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    return modulePermissionIds.every(id => selectedPermissionIds.includes(id));
  };

  const isModulePartiallySelected = (modulePermissions: Permission[]): boolean => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const selected = modulePermissionIds.filter(id => selectedPermissionIds.includes(id));
    return selected.length > 0 && selected.length < modulePermissionIds.length;
  };

  // Filter permissions based on search
  const filteredPermissions = Object.entries(permissions).reduce((acc, [module, modulePermissions]) => {
    if (searchTerm) {
      const filtered = modulePermissions.filter(
        p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[module] = filtered;
      }
    } else {
      acc[module] = modulePermissions;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const selectedCount = selectedPermissionIds.length;
  const totalCount = Object.values(permissions).flat().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header with search and stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono">
                  {selectedCount} / {totalCount} selected
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {selectedCount - role.permissions.length > 0 && `+${selectedCount - role.permissions.length} new`}
                  {selectedCount - role.permissions.length < 0 && `${selectedCount - role.permissions.length} removed`}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Permissions Grid */}
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading permissions...</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
              {Object.entries(filteredPermissions).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions found matching "{searchTerm}"
                </div>
              ) : (
                Object.entries(filteredPermissions).map(([module, modulePermissions]) => (
                  <div key={module} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`module-${module}`}
                          checked={isModuleSelected(modulePermissions)}
                          indeterminate={isModulePartiallySelected(modulePermissions)}
                          onCheckedChange={(checked) => handleModuleToggle(modulePermissions, !!checked)}
                        />
                        <Label 
                          htmlFor={`module-${module}`} 
                          className="font-medium text-sm uppercase tracking-wide cursor-pointer"
                        >
                          {module}
                        </Label>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {modulePermissions.filter(p => selectedPermissionIds.includes(p.id)).length} / {modulePermissions.length}
                      </Badge>
                    </div>
                    
                    <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissionIds.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id, !!checked)}
                          />
                          <Label 
                            htmlFor={permission.id} 
                            className="text-sm cursor-pointer"
                            title={permission.description}
                          >
                            {permission.action}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedPermissionIds(Object.values(permissions).flat().map(p => p.id))}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedPermissionIds([])}
            >
              Clear All
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || loadingPermissions} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update Permissions'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePermissionsDialog;
