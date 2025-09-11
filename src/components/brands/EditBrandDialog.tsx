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
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload } from 'lucide-react';
import { Brand, UpdateBrandData } from '@/api/services/brands.service';
import { brandsService } from '@/api/services/brands.service';
import { validateRequired, validateUrl } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface EditBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  onBrandUpdated: (brand: Brand) => void;
}

const EditBrandDialog: React.FC<EditBrandDialogProps> = ({
  open,
  onOpenChange,
  brand,
  onBrandUpdated,
}) => {
  const [formData, setFormData] = useState<UpdateBrandData>({
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (brand && open) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
        logoUrl: brand.logoUrl || '',
        website: brand.website || '',
        isActive: brand.isActive,
      });
      setErrors({});
    }
  }, [brand, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(formData.name || '', 'Brand name');
    if (nameError) newErrors.name = nameError;

    if (formData.logoUrl) {
      const logoUrlError = validateUrl(formData.logoUrl, 'Logo URL');
      if (logoUrlError) newErrors.logoUrl = logoUrlError;
    }

    if (formData.website) {
      const websiteError = validateUrl(formData.website, 'Website');
      if (websiteError) newErrors.website = websiteError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !validateForm()) return;

    setIsLoading(true);
    try {
      const updatedBrand = await brandsService.updateBrand(brand.id, formData);
      toast.success('Brand updated successfully');
      onBrandUpdated(updatedBrand);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update brand');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        description: '',
        logoUrl: '',
        website: '',
        isActive: true,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Edit Brand
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter brand name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
                className={errors.website ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={formData.logoUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
              className={errors.logoUrl ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.logoUrl && (
              <p className="text-sm text-red-500">{errors.logoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter brand description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isActive: checked }))
              }
              disabled={isLoading}
            />
            <Label htmlFor="isActive">Active Brand</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Brand'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBrandDialog;
