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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { brandsService, Brand, CreateBrandRequest } from '@/api/services/brands.service';
import { validateRequired, validateMinLength } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface AddBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandAdded: (brand: Brand) => void;
}

const AddBrandDialog: React.FC<AddBrandDialogProps> = ({
  open,
  onOpenChange,
  onBrandAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBrandRequest>({
    name: '',
    description: '',
    logoUrl: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    const nameError = validateRequired(formData.name, 'Brand name') ||
                     validateMinLength(formData.name, 2, 'Brand name');
    if (nameError) newErrors.name = nameError;

    // Logo URL validation (if provided)
    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      newErrors.logoUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanData: CreateBrandRequest = {
        ...formData,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      };

      const newBrand = await brandsService.createBrand(cleanData);
      onBrandAdded(newBrand);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create brand';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      isActive: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof CreateBrandRequest, value: any) => {
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
          <DialogTitle>Add New Brand</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Brand Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter brand name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brand description (optional)"
              rows={3}
            />
          </div>

          {/* Logo URL */}
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className={errors.logoUrl ? 'border-destructive' : ''}
            />
            {errors.logoUrl && <p className="text-sm text-destructive mt-1">{errors.logoUrl}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Enter a URL for the brand logo
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active Brand</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Adding Brand...' : 'Add Brand'}
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

export default AddBrandDialog;