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
  Users as UsersIcon, 
  UserCheck, 
  UserX,
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Loader2,
  Key,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';
import { usersService, User } from '@/api/services/users.service';
import { Role, rolesService } from '@/api/services/roles.service';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { formatDate } from '@/utils/format.utils';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import UserViewDialog from '@/components/users/UserViewDialog';
import ResetPasswordDialog from '@/components/users/ResetPasswordDialog';

const Users = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const limit = 10;

  const fetchUsers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await usersService.getUsers({
        page: currentPage,
        limit,
        search: debouncedSearchTerm || undefined,
      });

      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalUsers(response.meta.total);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchTerm]);

  // Handlers
  const handleRefresh = () => {
    fetchUsers(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await usersService.deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      fetchUsers();
      setUserToDelete(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersService.toggleUserStatus(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status';
      toast.error(errorMessage);
    }
  };

  const handleUserAdded = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    setTotalUsers(prev => prev + 1);
    toast.success('User created successfully');
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    toast.success('User updated successfully');
  };

  const handlePasswordReset = () => {
    toast.success('Password reset successfully');
  };

  const getStatusBadge = (user: User) => {
    return user.isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getRoleBadge = (role: Role) => {
    const colors = {
      ADMIN: 'bg-red-500 hover:bg-red-600',
      MANAGER: 'bg-blue-500 hover:bg-blue-600',
      STAFF: 'bg-green-500 hover:bg-green-600',
    };
    
    return (
      <Badge className={colors[role.name as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600'}>
        {role.name}
      </Badge>
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.isActive);
    const inactiveUsers = users.filter(u => !u.isActive);
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role.name] = (acc[user.role.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalUsers,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      roleDistribution,
    };
  }, [users, totalUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage system users and their access permissions
          </p>
        </div>
        {hasPermission(PERMISSIONS.USERS_CREATE) && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive Users
            </CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.inactiveUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.roleDistribution.ADMIN || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>System Users</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[150px]">Contact</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Last Login</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Created</TableHead>
                  <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                      </div>
                      {hasPermission(PERMISSIONS.USERS_CREATE) && !searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First User
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            <div className="flex items-center mt-1">
                              <Mail className="mr-1 h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="mr-1 h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(user)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(user)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                              >
                                <Edit className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleResetPassword(user)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Reset</span>
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleToggleStatus(user)}
                                className={`h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 ${
                                  user.isActive ? 'text-orange-600' : 'text-green-600'
                                }`}
                                title={user.isActive ? 'Deactivate User' : 'Activate User'}
                              >
                                {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                            </>
                          )}

                          {hasPermission(PERMISSIONS.USERS_DELETE) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(user)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-destructive hover:text-destructive"
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
                Page {currentPage} of {totalPages} • {totalUsers} total users
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
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUserAdded={handleUserAdded}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
          />

          <UserViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            user={selectedUser}
            onEdit={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}
            onResetPassword={() => {
              setIsViewDialogOpen(false);
              setIsResetPasswordDialogOpen(true);
            }}
            onToggleStatus={() => handleToggleStatus(selectedUser)}
          />

          <ResetPasswordDialog
            open={isResetPasswordDialogOpen}
            onOpenChange={setIsResetPasswordDialogOpen}
            user={selectedUser}
            onPasswordReset={handlePasswordReset}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.firstName} {userToDelete?.lastName}"? 
              This action cannot be undone and will fail if the user has related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
