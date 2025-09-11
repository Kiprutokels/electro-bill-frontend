import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react';
import { InventoryItem, inventoryService, InventoryAdjustmentType } from '@/api/services/inventory.service';
import { formatCurrency } from '@/utils/format.utils';
import { toast } from 'sonner';

interface InventoryAdjustmentDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AdjustmentData {
  type: InventoryAdjustmentType;
  quantity: number;
  reason: string;
  notes: string;
  unitCost?: number;
}

export function InventoryAdjustmentDialog({
  item,
  open,
  onOpenChange,
  onSuccess
}: InventoryAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState<AdjustmentData>({
    type: InventoryAdjustmentType.INCREASE,
    quantity: 0,
    reason: '',
    notes: '',
    unitCost: 0
  });

  React.useEffect(() => {
    if (item) {
      setAdjustment(prev => ({
        ...prev,
        unitCost: item.unitCost || 0
      }));
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (adjustment.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (!adjustment.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    // Calculate new quantity based on current available quantity
    const currentQuantity = item.quantityAvailable || item.quantity || 0;
    let newQuantity = currentQuantity;
    
    switch (adjustment.type) {
      case InventoryAdjustmentType.INCREASE:
        newQuantity = currentQuantity + adjustment.quantity;
        break;
      case InventoryAdjustmentType.DECREASE:
        newQuantity = Math.max(0, currentQuantity - adjustment.quantity);
        break;
      case InventoryAdjustmentType.SET:
        newQuantity = adjustment.quantity;
        break;
    }

    if (adjustment.type === InventoryAdjustmentType.DECREASE && newQuantity < 0) {
      toast.error('Cannot decrease quantity below 0');
      return;
    }

    setLoading(true);
    try {
      await inventoryService.adjustStock(item.id, {
        newQuantity,
        adjustmentType: adjustment.type,
        adjustmentQuantity: adjustment.quantity,
        reason: adjustment.reason,
        notes: adjustment.notes,
        unitCost: adjustment.unitCost
      });

      toast.success('Inventory adjusted successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      toast.error('Failed to adjust inventory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdjustment({
      type: InventoryAdjustmentType.INCREASE,
      quantity: 0,
      reason: '',
      notes: '',
      unitCost: item?.unitCost || 0
    });
  };

  const calculateNewQuantity = () => {
    if (!item) return 0;
    
    const currentQuantity = item.quantityAvailable || item.quantity || 0;
    
    switch (adjustment.type) {
      case InventoryAdjustmentType.INCREASE:
        return currentQuantity + (adjustment.quantity || 0);
      case InventoryAdjustmentType.DECREASE:
        return Math.max(0, currentQuantity - (adjustment.quantity || 0));
      case InventoryAdjustmentType.SET:
        return adjustment.quantity || 0;
      default:
        return currentQuantity;
    }
  };

  const getQuantityChange = () => {
    if (!item) return 0;
    const currentQuantity = item.quantityAvailable || item.quantity || 0;
    return calculateNewQuantity() - currentQuantity;
  };

  if (!item) return null;

  const currentQuantity = item.quantityAvailable || item.quantity || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Inventory
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium">{item.product.name}</h4>
            <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Current Stock:</span>
              <Badge variant="outline" className="font-mono">
                {currentQuantity} units
              </Badge>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select
              value={adjustment.type}
              onValueChange={(value) => setAdjustment(prev => ({ 
                ...prev, 
                type: value as InventoryAdjustmentType
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={InventoryAdjustmentType.INCREASE}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Increase Stock
                  </div>
                </SelectItem>
                <SelectItem value={InventoryAdjustmentType.DECREASE}>
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Decrease Stock
                  </div>
                </SelectItem>
                <SelectItem value={InventoryAdjustmentType.SET}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Set Exact Amount
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>
              {adjustment.type === InventoryAdjustmentType.SET ? 'New Quantity' : 'Adjustment Quantity'}
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={adjustment.quantity || ''}
              onChange={(e) => setAdjustment(prev => ({ 
                ...prev, 
                quantity: parseInt(e.target.value) || 0 
              }))}
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Unit Cost (for increases) */}
          {adjustment.type === InventoryAdjustmentType.INCREASE && (
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={adjustment.unitCost || ''}
                onChange={(e) => setAdjustment(prev => ({ 
                  ...prev, 
                  unitCost: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Enter unit cost"
              />
              <p className="text-xs text-muted-foreground">
                Total cost: {formatCurrency((adjustment.unitCost || 0) * (adjustment.quantity || 0))}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select
              value={adjustment.reason}
              onValueChange={(value) => setAdjustment(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damaged">Damaged Goods</SelectItem>
                <SelectItem value="expired">Expired Items</SelectItem>
                <SelectItem value="theft">Theft/Loss</SelectItem>
                <SelectItem value="found">Found Items</SelectItem>
                <SelectItem value="recount">Physical Recount</SelectItem>
                <SelectItem value="supplier_error">Supplier Error</SelectItem>
                <SelectItem value="return">Customer Return</SelectItem>
                <SelectItem value="transfer">Stock Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={adjustment.notes}
              onChange={(e) => setAdjustment(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter additional details..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Adjustment Summary</h4>
            <div className="flex justify-between text-sm">
              <span>Current Quantity:</span>
              <span className="font-mono">{currentQuantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>New Quantity:</span>
              <span className="font-mono font-medium">{calculateNewQuantity()}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Net Change:</span>
              <span className={`font-mono ${getQuantityChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getQuantityChange() >= 0 ? '+' : ''}{getQuantityChange()}
              </span>
            </div>
          </div>

          {/* Warning for large decreases */}
          {adjustment.type === InventoryAdjustmentType.DECREASE && adjustment.quantity > currentQuantity && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                This will reduce stock to 0. Quantity will be adjusted automatically.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
