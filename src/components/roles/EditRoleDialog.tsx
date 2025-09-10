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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { rolesService, Role, UpdateRoleRequest } from '@/api/services/roles.service';
import { toast } from 'sonner';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onRoleUpdated: (role: Role) => void;
}

const EditRoleDialog: React.FC<EditRoleDialogProps> = ({
  open,
  onOpenChange,
  role,
  onRoleUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateRoleRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role && open) {
      setFormData({
        name: role.name,
        description: role.description || '',
      });
      setErrors({});
    }
  }, [role, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Role name must be at least 2 characters';
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
      const cleanData: UpdateRoleRequest = {
        name: formData.name?.trim().toUpperCase(),
        description: formData.description?.trim() || undefined,
      };

      const updatedRole = await rolesService.updateRole(role.id, cleanData);
      onRoleUpdated(updatedRole);
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update role';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateRoleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Role Name <span className="text-destructive">*</span></Label>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., SALES_MANAGER"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Role names are automatically converted to uppercase
            </p>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the role and its responsibilities..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update Role'}
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

export default EditRoleDialog;
