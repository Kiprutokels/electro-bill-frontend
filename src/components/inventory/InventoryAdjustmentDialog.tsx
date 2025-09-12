import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Plus, Minus, Settings, Loader2, AlertTriangle } from "lucide-react";
import {
  InventoryItem,
  InventoryAdjustmentType,
  ManualInventoryAdjustment,
  inventoryService,
} from "@/api/services/inventory.service";
import { validateRequired } from "@/utils/validation.utils";
import { toast } from "sonner";

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

const InventoryAdjustmentDialog: React.FC<InventoryAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ManualInventoryAdjustment>({
    productId: "",
    quantity: 0,
    type: InventoryAdjustmentType.INCREASE,
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item && open) {
      setFormData({
        productId: item.productId,
        quantity: 0,
        type: InventoryAdjustmentType.INCREASE,
        reason: "",
      });
      setErrors({});
    }
  }, [item, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    const reasonError = validateRequired(formData.reason, "Reason");
    if (reasonError) newErrors.reason = reasonError;

    // Check for sufficient stock when decreasing
    if (
      formData.type === InventoryAdjustmentType.DECREASE &&
      item &&
      formData.quantity > (item.quantityAvailable || 0)
    ) {
      newErrors.quantity = `Cannot decrease by more than available stock (${item.quantityAvailable || 0})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !item) {
      return;
    }

    setLoading(true);
    try {
      await inventoryService.adjustInventory(formData);
      toast.success("Inventory adjusted successfully");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to adjust inventory";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: item?.productId || "",
      quantity: 0,
      type: InventoryAdjustmentType.INCREASE,
      reason: "",
    });
    setErrors({});
  };

  const getAdjustmentPreview = () => {
    if (!item) return null;

    const currentQuantity = item.quantityAvailable || 0;
    let newQuantity = currentQuantity;

    switch (formData.type) {
      case InventoryAdjustmentType.INCREASE:
        newQuantity = currentQuantity + formData.quantity;
        break;
      case InventoryAdjustmentType.DECREASE:
        newQuantity = Math.max(0, currentQuantity - formData.quantity);
        break;
      case InventoryAdjustmentType.CORRECTION:
        newQuantity = formData.quantity;
        break;
    }

    const change = newQuantity - currentQuantity;

    return {
      current: currentQuantity,
      new: newQuantity,
      change,
    };
  };

  if (!item) return null;

  const preview = getAdjustmentPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adjust Inventory Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium">{item.product?.name || "Unknown Product"}</h4>
            <p className="text-sm text-muted-foreground">
              SKU: {item.product?.sku || "N/A"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Current Stock:</span>
              <Badge variant="outline" className="font-mono">
                {item.quantityAvailable || 0} units
              </Badge>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value as InventoryAdjustmentType }))
              }
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
                <SelectItem value={InventoryAdjustmentType.CORRECTION}>
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
              {formData.type === InventoryAdjustmentType.CORRECTION
                ? "New Quantity"
                : "Adjustment Quantity"}
            </Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
              }
              placeholder="Enter quantity"
              className={errors.quantity ? "border-destructive" : ""}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
            >
              <SelectTrigger className={errors.reason ? "border-destructive" : ""}>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock count correction">Stock count correction</SelectItem>
                <SelectItem value="Damaged goods">Damaged goods</SelectItem>
                <SelectItem value="Expired items">Expired items</SelectItem>
                <SelectItem value="Theft/Loss">Theft/Loss</SelectItem>
                <SelectItem value="Found items">Found items</SelectItem>
                <SelectItem value="Supplier error">Supplier error</SelectItem>
                <SelectItem value="Customer return">Customer return</SelectItem>
                <SelectItem value="Transfer in">Transfer in</SelectItem>
                <SelectItem value="Transfer out">Transfer out</SelectItem>
                <SelectItem value="Manual adjustment">Manual adjustment</SelectItem>
              </SelectContent>
            </Select>
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>

          <Separator />

          {/* Adjustment Preview */}
          {preview && formData.quantity > 0 && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Adjustment Preview</h4>
              <div className="flex justify-between text-sm">
                <span>Current Quantity:</span>
                <span className="font-mono">{preview.current}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Quantity:</span>
                <span className="font-mono font-medium">{preview.new}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Net Change:</span>
                <span
                  className={`font-mono ${
                    preview.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {preview.change >= 0 ? "+" : ""}
                  {preview.change}
                </span>
              </div>
            </div>
          )}

          {/* Warning for large decreases */}
          {formData.type === InventoryAdjustmentType.DECREASE &&
            formData.quantity > (item.quantityAvailable || 0) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  This adjustment exceeds available stock. The quantity will be set to 0.
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryAdjustmentDialog;