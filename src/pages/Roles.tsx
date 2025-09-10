import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  Users, 
  Shield, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Loader2,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';
import { rolesService, Role } from '@/api/services/roles.service';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { formatDate } from '@/utils/format.utils';
import AddRoleDialog from '@/components/roles/AddRoleDialog';
import EditRoleDialog from '@/components/roles/EditRoleDialog';
import RoleViewDialog from '@/components/roles/RoleViewDialog';
import ManagePermissionsDialog from '@/components/roles/ManagePermissionsDialog';

const Roles = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const limit = 10;

  const fetchRoles = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await rolesService.getRoles({
        page: currentPage,
        limit,
        search: debouncedSearchTerm || undefined,
      });

      setRoles(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalRoles(response.meta.total);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch roles';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchRoles();
  }, [currentPage, debouncedSearchTerm]);

  // Handlers
  const handleRefresh = () => {
    fetchRoles(true);
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await rolesService.deleteRole(roleToDelete.id);
      toast.success('Role deleted successfully');
      fetchRoles();
      setRoleToDelete(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete role';
      toast.error(errorMessage);
    }
  };

  const handleRoleAdded = (newRole: Role) => {
    setRoles(prev => [newRole, ...prev]);
    setTotalRoles(prev => prev + 1);
    toast.success('Role created successfully');
  };

  const handleRoleUpdated = (updatedRole: Role) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    toast.success('Role updated successfully');
  };

  const handlePermissionsUpdated = (updatedRole: Role) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    toast.success('Permissions updated successfully');
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalPermissions = roles.reduce((sum, r) => sum + r.permissions.length, 0);
    const avgPermissionsPerRole = roles.length > 0 ? Math.round(totalPermissions / roles.length) : 0;
    
    return {
      totalRoles,
      totalPermissions: totalPermissions,
      avgPermissionsPerRole,
    };
  }, [roles, totalRoles]);

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        {hasPermission(PERMISSIONS.ROLES_CREATE) && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalRoles}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Permissions
            </CardTitle>
            <Key className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalPermissions}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Permissions/Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.avgPermissionsPerRole}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>System Roles</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Role Name</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Description</TableHead>
                  <TableHead className="text-center min-w-[100px]">Permissions</TableHead>
                  <TableHead className="text-center min-w-[80px]">Users</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">Created</TableHead>
                  <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No roles found matching your search.' : 'No roles found.'}
                      </div>
                      {hasPermission(PERMISSIONS.ROLES_CREATE) && !searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Role
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {role.description}
                          </div>
                          <div className="text-sm text-muted-foreground lg:hidden">
                            Created {formatDate(role.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs">
                          {role.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {role.permissions.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={role.userCount > 0 ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {role.userCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(role.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(role)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          
                          {hasPermission(PERMISSIONS.PERMISSIONS_ASSIGN) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleManagePermissions(role)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Key className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Permissions</span>
                            </Button>
                          )}

                          {hasPermission(PERMISSIONS.ROLES_UPDATE) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(role)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Edit className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}

                          {hasPermission(PERMISSIONS.ROLES_DELETE) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(role)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {totalRoles} total roles
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddRoleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onRoleAdded={handleRoleAdded}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            role={selectedRole}
            onRoleUpdated={handleRoleUpdated}
          />

          <RoleViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            role={selectedRole}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onManagePermissions={() => {
              setIsViewDialogOpen(false);
              setIsPermissionsDialogOpen(true);
            }}
          />

          <ManagePermissionsDialog
            open={isPermissionsDialogOpen}
            onOpenChange={setIsPermissionsDialogOpen}
            role={selectedRole}
            onPermissionsUpdated={handlePermissionsUpdated}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? 
              This action cannot be undone and will fail if the role has assigned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Roles;
