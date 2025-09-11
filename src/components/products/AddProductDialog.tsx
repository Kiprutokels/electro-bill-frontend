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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { productsService, Product, CreateProductRequest } from '@/api/services/products.service';
import { ProductCategory } from '@/api/services/categories.service';
import { Brand } from '@/api/services/brands.service';
import { validateRequired, validateMinLength } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (product: Product) => void;
  categories: ProductCategory[];
  brands: Brand[];
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onProductAdded,
  categories,
  brands,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductRequest>({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    unitOfMeasure: 'PCS',
    sellingPrice: 0,
    wholesalePrice: 0,
    weight: 0,
    dimensions: '',
    warrantyPeriodMonths: 0,
    reorderLevel: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // SKU validation
    const skuError = validateRequired(formData.sku, 'SKU') ||
                    validateMinLength(formData.sku, 3, 'SKU');
    if (skuError) newErrors.sku = skuError;

    // Name validation
    const nameError = validateRequired(formData.name, 'Product name') ||
                     validateMinLength(formData.name, 2, 'Product name');
    if (nameError) newErrors.name = nameError;

    // Category validation
    const categoryError = validateRequired(formData.categoryId, 'Category');
    if (categoryError) newErrors.categoryId = categoryError;

    // Price validation
    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }

    if (formData.wholesalePrice && formData.wholesalePrice < 0) {
      newErrors.wholesalePrice = 'Wholesale price must be 0 or greater';
    }

    if (formData.weight && formData.weight < 0) {
      newErrors.weight = 'Weight must be 0 or greater';
    }

    if (formData.warrantyPeriodMonths && formData.warrantyPeriodMonths < 0) {
      newErrors.warrantyPeriodMonths = 'Warranty period must be 0 or greater';
    }

    if (formData.reorderLevel && formData.reorderLevel < 0) {
      newErrors.reorderLevel = 'Reorder level must be 0 or greater';
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
      const cleanData: CreateProductRequest = {
        ...formData,
        description: formData.description || undefined,
        brandId: formData.brandId === 'no-brand' ? undefined : formData.brandId || undefined,
        wholesalePrice: formData.wholesalePrice || undefined,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions || undefined,
        warrantyPeriodMonths: formData.warrantyPeriodMonths || undefined,
        reorderLevel: formData.reorderLevel || undefined,
      };

      const newProduct = await productsService.createProduct(cleanData);
      onProductAdded(newProduct);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      brandId: '',
      unitOfMeasure: 'PCS',
      sellingPrice: 0,
      wholesalePrice: 0,
      weight: 0,
      dimensions: '',
      warrantyPeriodMonths: 0,
      reorderLevel: 0,
      isActive: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const activeCategories = categories.filter(c => c.isActive);
  const activeBrands = brands.filter(b => b.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <Label htmlFor="sku">SKU <span className="text-destructive">*</span></Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="e.g., TPL-AC1200"
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && <p className="text-sm text-destructive mt-1">{errors.sku}</p>}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId">Category <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleInputChange('categoryId', value)}
              >
                <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId}</p>}
            </div>

            {/* Brand */}
            <div>
              <Label htmlFor="brandId">Brand</Label>
              <Select 
                value={formData.brandId} 
                onValueChange={(value) => handleInputChange('brandId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand (optional)" />
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

            {/* Unit of Measure */}
            <div>
              <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
              <Input
                id="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                placeholder="PCS"
              />
            </div>

            {/* Selling Price */}
            <div>
              <Label htmlFor="sellingPrice">Selling Price <span className="text-destructive">*</span></Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                className={errors.sellingPrice ? 'border-destructive' : ''}
              />
              {errors.sellingPrice && <p className="text-sm text-destructive mt-1">{errors.sellingPrice}</p>}
            </div>

            {/* Wholesale Price */}
            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price</Label>
              <Input
                id="wholesalePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => handleInputChange('wholesalePrice', parseFloat(e.target.value) || 0)}
                className={errors.wholesalePrice ? 'border-destructive' : ''}
              />
              {errors.wholesalePrice && <p className="text-sm text-destructive mt-1">{errors.wholesalePrice}</p>}
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weight">Weight (KG)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.001"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                className={errors.weight ? 'border-destructive' : ''}
              />
              {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight}</p>}
            </div>

            {/* Warranty Period */}
            <div>
              <Label htmlFor="warrantyPeriodMonths">Warranty (Months)</Label>
              <Input
                id="warrantyPeriodMonths"
                type="number"
                min="0"
                value={formData.warrantyPeriodMonths}
                onChange={(e) => handleInputChange('warrantyPeriodMonths', parseInt(e.target.value) || 0)}
                className={errors.warrantyPeriodMonths ? 'border-destructive' : ''}
              />
              {errors.warrantyPeriodMonths && <p className="text-sm text-destructive mt-1">{errors.warrantyPeriodMonths}</p>}
            </div>

            {/* Reorder Level */}
            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
                className={errors.reorderLevel ? 'border-destructive' : ''}
              />
              {errors.reorderLevel && <p className="text-sm text-destructive mt-1">{errors.reorderLevel}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Product description (optional)"
              rows={3}
            />
          </div>

          {/* Dimensions */}
          <div>
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={formData.dimensions}
              onChange={(e) => handleInputChange('dimensions', e.target.value)}
              placeholder="e.g., 20cm x 15cm x 5cm"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Adding Product...' : 'Add Product'}
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

export default AddProductDialog;