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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FolderEdit } from 'lucide-react';
import { ProductCategory, UpdateCategoryData, categoriesService } from '@/api/services/categories.service';
import { validateRequired } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProductCategory | null;
  onCategoryUpdated: (category: ProductCategory) => void;
  categories: ProductCategory[];
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
  onCategoryUpdated,
  categories,
}) => {
  const [formData, setFormData] = useState<UpdateCategoryData>({
    name: '',
    description: '',
    parentCategoryId: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name,
        description: category.description || '',
        parentCategoryId: category.parentCategoryId || '',
        isActive: category.isActive,
      });
      setErrors({});
    }
  }, [category, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(formData.name || '', 'Category name');
    if (nameError) newErrors.name = nameError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !validateForm()) return;

    setIsLoading(true);
    try {
      const cleanData: UpdateCategoryData = {
        ...formData,
        parentCategoryId: formData.parentCategoryId || undefined,
      };

      const updatedCategory = await categoriesService.updateCategory(category.id, cleanData);
      onCategoryUpdated(updatedCategory);
      toast.success('Category updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        description: '',
        parentCategoryId: '',
        isActive: true,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  // Filter out the current category and its descendants to prevent circular references
  const availableParents = categories.filter(cat => {
    if (!category) return cat.isActive && !cat.parentCategoryId;
    return cat.isActive && 
           cat.id !== category.id && 
           cat.parentCategoryId !== category.id &&
           !cat.parentCategoryId; // Only show root categories as potential parents
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderEdit className="h-5 w-5" />
            Edit Category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentCategoryId">Parent Category</Label>
            <Select
              value={formData.parentCategoryId || ''}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, parentCategoryId: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Parent (Root Category)</SelectItem>
                {availableParents.map((parentCat) => (
                  <SelectItem key={parentCat.id} value={parentCat.id}>
                    {parentCat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter category description"
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
            <Label htmlFor="isActive">Active Category</Label>
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
                'Update Category'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
