import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { usersService, User, UpdateUserRequest } from '@/api/services/users.service';
import { rolesService, Role } from '@/api/services/roles.service';
import { validateEmail, validatePhone, validateRequired, validateMinLength } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUserUpdated: (user: User) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<UpdateUserRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        roleId: user.role.id,
        isActive: user.isActive,
      });
      setErrors({});
      loadRoles();
    }
  }, [user, open]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await rolesService.getRoles({ limit: 100 });
      setRoles(response.data);
    } catch (err: any) {
      toast.error('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (formData.username !== undefined) {
      const usernameError = validateRequired(formData.username, 'Username') ||
                           validateMinLength(formData.username, 3, 'Username');
      if (usernameError) newErrors.username = usernameError;
    }

    // Email validation
    if (formData.email !== undefined) {
      const emailError = validateRequired(formData.email, 'Email');
      if (emailError) {
        newErrors.email = emailError;
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Name validation
    if (formData.firstName !== undefined) {
      const firstNameError = validateRequired(formData.firstName, 'First name');
      if (firstNameError) newErrors.firstName = firstNameError;
    }

    if (formData.lastName !== undefined) {
      const lastNameError = validateRequired(formData.lastName, 'Last name');
      if (lastNameError) newErrors.lastName = lastNameError;
    }

    // Phone validation (optional)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Role validation
    if (formData.roleId !== undefined) {
      const roleError = validateRequired(formData.roleId, 'Role');
      if (roleError) newErrors.roleId = roleError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanData: UpdateUserRequest = {
        ...formData,
        phone: formData.phone || undefined,
      };

      const updatedUser = await usersService.updateUser(user.id, cleanData);
      onUserUpdated(updatedUser);
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <Label htmlFor="edit-username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="edit-username"
                value={formData.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="johndoe"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && <p className="text-sm text-destructive mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="edit-firstName">First Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="edit-lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+254700000000"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="edit-roleId">Role <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.roleId || ''} 
                onValueChange={(value) => handleInputChange('roleId', value)}
                disabled={loadingRoles}
              >
                <SelectTrigger className={errors.roleId ? 'border-destructive' : ''}>
                  <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {role.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && <p className="text-sm text-destructive mt-1">{errors.roleId}</p>}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={formData.isActive || false}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="edit-isActive">Active User</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || loadingRoles} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update User'}
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

export default EditUserDialog;
