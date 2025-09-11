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
import { Loader2, Package } from 'lucide-react';
import { Product, UpdateProductData, productsService } from '@/api/services/products.service';
import { ProductCategory } from '@/api/services/categories.service';
import { Brand } from '@/api/services/brands.service';
import { validateRequired, validateNumber, validateDecimal } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductUpdated: (product: Product) => void;
  categories: ProductCategory[];
  brands: Brand[];
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onProductUpdated,
  categories,
  brands,
}) => {
  const [formData, setFormData] = useState<UpdateProductData>({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    brandId: '',
    sellingPrice: 0,
    wholesalePrice: 0,
    reorderLevel: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        categoryId: product.categoryId,
        brandId: product.brandId || 'no-brand',
        sellingPrice: product.sellingPrice,
        wholesalePrice: product.wholesalePrice || 0,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      });
      setErrors({});
    }
  }, [product, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(formData.name || '', 'Product name');
    if (nameError) newErrors.name = nameError;

    const skuError = validateRequired(formData.sku || '', 'SKU');
    if (skuError) newErrors.sku = skuError;

    const categoryError = validateRequired(formData.categoryId || '', 'Category');
    if (categoryError) newErrors.categoryId = categoryError;

    const sellingPriceError = validateDecimal(formData.sellingPrice || 0, 'Selling price', { min: 0.01 });
    if (sellingPriceError) newErrors.sellingPrice = sellingPriceError;

    if (formData.wholesalePrice !== null && formData.wholesalePrice !== undefined && formData.wholesalePrice > 0) {
      const wholesalePriceError = validateDecimal(formData.wholesalePrice, 'Wholesale price', { min: 0 });
      if (wholesalePriceError) newErrors.wholesalePrice = wholesalePriceError;
    }

    const reorderError = validateNumber(formData.reorderLevel || 0, 'Reorder level', { min: 0 });
    if (reorderError) newErrors.reorderLevel = reorderError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !validateForm()) return;

    setIsLoading(true);
    try {
      const cleanData: UpdateProductData = {
        ...formData,
        brandId: formData.brandId === 'no-brand' ? undefined : formData.brandId || undefined,
        wholesalePrice: formData.wholesalePrice || undefined,
      };

      const updatedProduct = await productsService.updateProduct(product.id, cleanData);
      onProductUpdated(updatedProduct);
      toast.success('Product updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        description: '',
        sku: '',
        categoryId: '',
        brandId: '',
        sellingPrice: 0,
        wholesalePrice: 0,
        reorderLevel: 0,
        isActive: true,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const activeCategories = categories.filter(c => c.isActive && c.id && c.id.toString().trim() !== '');
  const activeBrands = brands.filter(b => b.isActive && b.id && b.id.toString().trim() !== '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU <span className="text-destructive">*</span></Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
                className={errors.sku ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select
                value={formData.categoryId || ''}
                onValueChange={(value) => handleInputChange('categoryId', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.parentCategory ? `${category.parentCategory.name} > ` : ''}{category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={formData.brandId || 'no-brand'}
                onValueChange={(value) => handleInputChange('brandId', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-brand">No Brand</SelectItem>
                  {activeBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price <span className="text-destructive">*</span></Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.sellingPrice || ''}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.sellingPrice ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">{errors.sellingPrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price</Label>
              <Input
                id="wholesalePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice || ''}
                onChange={(e) => handleInputChange('wholesalePrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.wholesalePrice ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.wholesalePrice && (
                <p className="text-sm text-destructive">{errors.wholesalePrice}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level <span className="text-destructive">*</span></Label>
            <Input
              id="reorderLevel"
              type="number"
              min="0"
              value={formData.reorderLevel || ''}
              onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
              placeholder="0"
              className={errors.reorderLevel ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.reorderLevel && (
              <p className="text-sm text-destructive">{errors.reorderLevel}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive || false}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="isActive">Active Product</Label>
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
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;