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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { usersService, User, CreateUserRequest } from '@/api/services/users.service';
import { rolesService, Role } from '@/api/services/roles.service';
import { validateEmail, validatePhone, validatePassword, validateRequired, validateMinLength } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (user: User) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  onUserAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load roles when dialog opens
  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

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
    const usernameError = validateRequired(formData.username, 'Username') ||
                         validateMinLength(formData.username, 3, 'Username');
    if (usernameError) newErrors.username = usernameError;

    // Email validation
    const emailError = validateRequired(formData.email, 'Email');
    if (emailError) {
      newErrors.email = emailError;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Name validation
    const firstNameError = validateRequired(formData.firstName, 'First name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateRequired(formData.lastName, 'Last name');
    if (lastNameError) newErrors.lastName = lastNameError;

    // Phone validation (optional)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Role validation
    const roleError = validateRequired(formData.roleId, 'Role');
    if (roleError) newErrors.roleId = roleError;

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
      const cleanData: CreateUserRequest = {
        ...formData,
        phone: formData.phone || undefined,
      };

      const newUser = await usersService.createUser(cleanData);
      onUserAdded(newUser);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
    });
    setErrors({});
    setShowPassword(false);
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
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
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="johndoe"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && <p className="text-sm text-destructive mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+254700000000"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="roleId">Role <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.roleId} 
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

          {/* Password */}
          <div>
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter a secure password"
                className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Password must contain at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || loadingRoles} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating User...' : 'Create User'}
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

export default AddUserDialog;
