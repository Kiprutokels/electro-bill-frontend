import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { usersService, User } from '@/api/services/users.service';
import { validatePassword } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onPasswordReset: () => void;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onOpenChange,
  user,
  onPasswordReset,
}) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await usersService.resetPassword(user.id, { newPassword });
      onPasswordReset();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'newPassword') {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Reset password for {user.firstName} {user.lastName} (@{user.username})
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <Label htmlFor="newPassword">New Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter new password"
                className={`pr-10 ${errors.newPassword ? 'border-destructive' : ''}`}
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
            {errors.newPassword && <p className="text-sm text-destructive mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            Password must contain at least 8 characters with uppercase, lowercase, number, and special character
          </p>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordDialog;
