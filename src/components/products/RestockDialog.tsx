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
import { Loader2, Package } from 'lucide-react';
import { Product } from '@/api/services/products.service';
import { productBatchesService, CreateProductBatchRequest } from '@/api/services/product-batches.service';
import { validateRequired, validateNumber, validateDecimal } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onRestockComplete: () => void;
}

const RestockDialog: React.FC<RestockDialogProps> = ({
  open,
  onOpenChange,
  product,
  onRestockComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateProductBatchRequest, 'productId'>>({
    supplierBatchRef: '',
    buyingPrice: 0,
    quantityReceived: 0,
    expiryDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const buyingPriceError = validateDecimal(formData.buyingPrice, 'Buying price', { min: 0 });
    if (buyingPriceError) newErrors.buyingPrice = buyingPriceError;

    const quantityError = validateNumber(formData.quantityReceived, 'Quantity received', { min: 1 });
    if (quantityError) newErrors.quantityReceived = quantityError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !product) {
      return;
    }

    setLoading(true);
    try {
      const batchData: CreateProductBatchRequest = {
        ...formData,
        productId: product.id,
        supplierBatchRef: formData.supplierBatchRef || undefined,
        expiryDate: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
      };

      await productBatchesService.createBatch(batchData);
      toast.success('Stock added successfully');
      onRestockComplete();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add stock';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierBatchRef: '',
      buyingPrice: 0,
      quantityReceived: 0,
      expiryDate: '',
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Stock - {product?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">SKU:</span> {product?.sku}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Current Stock:</span> {product?.totalQuantity || 0} units
            </p>
          </div>

          {/* Supplier Batch Reference */}
          <div>
            <Label htmlFor="supplierBatchRef">Supplier Batch Reference</Label>
            <Input
              id="supplierBatchRef"
              value={formData.supplierBatchRef}
              onChange={(e) => handleInputChange('supplierBatchRef', e.target.value)}
              placeholder="e.g., SUP-REF-001"
            />
          </div>

          {/* Buying Price */}
          <div>
            <Label htmlFor="buyingPrice">Buying Price <span className="text-destructive">*</span></Label>
            <Input
              id="buyingPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.buyingPrice}
              onChange={(e) => handleInputChange('buyingPrice', parseFloat(e.target.value) || 0)}
              className={errors.buyingPrice ? 'border-destructive' : ''}
            />
            {errors.buyingPrice && <p className="text-sm text-destructive mt-1">{errors.buyingPrice}</p>}
          </div>

          {/* Quantity Received */}
          <div>
            <Label htmlFor="quantityReceived">Quantity Received <span className="text-destructive">*</span></Label>
            <Input
              id="quantityReceived"
              type="number"
              min="1"
              value={formData.quantityReceived}
              onChange={(e) => handleInputChange('quantityReceived', parseInt(e.target.value) || 0)}
              className={errors.quantityReceived ? 'border-destructive' : ''}
            />
            {errors.quantityReceived && <p className="text-sm text-destructive mt-1">{errors.quantityReceived}</p>}
          </div>

          {/* Expiry Date */}
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Adding Stock...' : 'Add Stock'}
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

export default RestockDialog;
