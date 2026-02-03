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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Plus,
  Minus,
  Settings,
  Loader2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import {
  InventoryItem,
  InventoryAdjustmentType,
  ManualInventoryAdjustment,
  inventoryService,
} from "@/api/services/inventory.service";
import { validateRequired } from "@/utils/validation.utils";
import { toast } from "sonner";
import ImeiEntryDialog from "./ImeiEntryDialog";
import ImeiSelectionDialog from "./ImeiSelectionDialog";
import { DeviceImeiInput } from "@/api/types/device.types";

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
  const [showImeiEntryDialog, setShowImeiEntryDialog] = useState(false);
  const [showImeiSelectionDialog, setShowImeiSelectionDialog] = useState(false);

  const [formData, setFormData] = useState<ManualInventoryAdjustment>({
    productId: "",
    quantity: 0,
    type: InventoryAdjustmentType.INCREASE,
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isTracked = item?.product?.isImeiTracked || false;

  console.log('[InventoryAdjustmentDialog] Item:', item?.product?.name, 'isTracked:', isTracked);

  useEffect(() => {
    if (item && open) {
      console.log('[InventoryAdjustmentDialog] Dialog opened for item:', item.productId);
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

  const submitAdjustment = async (deviceImeis: DeviceImeiInput[] | string[]) => {
    if (!item) return;

    console.log('[InventoryAdjustmentDialog] Submitting adjustment:', formData.type, 'quantity:', formData.quantity, 'IMEIs:', deviceImeis.length);

    setLoading(true);
    try {
      const formattedImeis: DeviceImeiInput[] = deviceImeis.map((imei: any) => {
        if (typeof imei === "string") {
          return { imeiNumber: imei };
        }
        return imei;
      });

      const adjustmentData: any = {
        ...formData,
        deviceImeis: formattedImeis.length > 0 ? formattedImeis : undefined,
      };

      console.log('[InventoryAdjustmentDialog] Adjustment payload:', adjustmentData);

      await inventoryService.adjustInventory(adjustmentData);
      
      console.log('[InventoryAdjustmentDialog] Adjustment successful');
      toast.success(
        formattedImeis.length > 0
          ? `Inventory adjusted with ${formattedImeis.length} device IMEIs`
          : "Inventory adjusted successfully",
      );
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error('[InventoryAdjustmentDialog] Adjustment error:', err);
      const errorMessage =
        err.response?.data?.message || "Failed to adjust inventory";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !item) return;

    console.log('[InventoryAdjustmentDialog] Form submitted, type:', formData.type, 'isTracked:', isTracked);

    // For INCREASE: optionally add IMEIs (manual entry)
    if (formData.type === InventoryAdjustmentType.INCREASE) {
      console.log('[InventoryAdjustmentDialog] INCREASE: opening IMEI entry dialog');
      setShowImeiEntryDialog(true);
      return;
    }

    // For DECREASE: if tracked, must select existing IMEIs
    if (formData.type === InventoryAdjustmentType.DECREASE) {
      if (isTracked) {
        console.log('[InventoryAdjustmentDialog] DECREASE (tracked): opening IMEI selection dialog');
        setShowImeiSelectionDialog(true);
        return;
      } else {
        console.log('[InventoryAdjustmentDialog] DECREASE (non-tracked): submitting without IMEIs');
        await submitAdjustment([]);
        return;
      }
    }

    // For CORRECTION: handle both increase and decrease
    if (formData.type === InventoryAdjustmentType.CORRECTION) {
      const currentQty = item.quantityAvailable || 0;
      const targetQty = formData.quantity;
      const diff = targetQty - currentQty;

      console.log('[InventoryAdjustmentDialog] CORRECTION: current=', currentQty, 'target=', targetQty, 'diff=', diff);

      if (diff > 0 && isTracked) {
        // Need to add devices
        console.log('[InventoryAdjustmentDialog] CORRECTION (increase, tracked): opening IMEI entry dialog');
        setShowImeiEntryDialog(true);
        return;
      }

      if (diff < 0 && isTracked) {
        // Need to remove devices
        console.log('[InventoryAdjustmentDialog] CORRECTION (decrease, tracked): opening IMEI selection dialog');
        setShowImeiSelectionDialog(true);
        return;
      }

      // Non-tracked or no change
      console.log('[InventoryAdjustmentDialog] CORRECTION (non-tracked): submitting without IMEIs');
      await submitAdjustment([]);
    }
  };

  const resetForm = () => {
    console.log('[InventoryAdjustmentDialog] Resetting form');
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

    return { current: currentQuantity, new: newQuantity, change };
  };

  if (!item) return null;
  const preview = getAdjustmentPreview();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Adjust Inventory Stock
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">
                {item.product?.name || "Unknown Product"}
              </h4>
              <p className="text-sm text-muted-foreground">
                SKU: {item.product?.sku || "N/A"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">Current Stock:</span>
                <Badge variant="outline" className="font-mono">
                  {item.quantityAvailable || 0} units
                </Badge>
              </div>
              {isTracked && (
                <div className="flex items-center gap-2 mt-2 text-amber-600">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs font-medium">IMEI-Tracked Product</span>
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as InventoryAdjustmentType,
                  }))
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
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
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
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, reason: value }))
                }
              >
                <SelectTrigger
                  className={errors.reason ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock count correction">
                    Stock count correction
                  </SelectItem>
                  <SelectItem value="Damaged goods">Damaged goods</SelectItem>
                  <SelectItem value="Expired items">Expired items</SelectItem>
                  <SelectItem value="Theft/Loss">Theft/Loss</SelectItem>
                  <SelectItem value="Found items">Found items</SelectItem>
                  <SelectItem value="Supplier error">Supplier error</SelectItem>
                  <SelectItem value="Customer return">
                    Customer return
                  </SelectItem>
                  <SelectItem value="Transfer in">Transfer in</SelectItem>
                  <SelectItem value="Transfer out">Transfer out</SelectItem>
                  <SelectItem value="Manual adjustment">
                    Manual adjustment
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason}</p>
              )}
            </div>

            {/* IMEI Notice for INCREASE */}
            {formData.type === InventoryAdjustmentType.INCREASE &&
              formData.quantity > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Smartphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    You can add device IMEIs in the next step (optional for increase)
                  </p>
                </div>
              )}

            {/* IMEI Notice for DECREASE (tracked) */}
            {formData.type === InventoryAdjustmentType.DECREASE &&
              isTracked &&
              formData.quantity > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    You must select {formData.quantity} device(s) to remove in the next step
                  </p>
                </div>
              )}

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
                    This adjustment exceeds available stock. The quantity will
                    be set to 0.
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
                {loading
                  ? "Processing..."
                  : formData.type === InventoryAdjustmentType.DECREASE && isTracked
                    ? "Select Devices"
                    : formData.type === InventoryAdjustmentType.INCREASE
                      ? "Continue"
                      : "Adjust Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMEI Entry Dialog (for INCREASE) */}
      <ImeiEntryDialog
        open={showImeiEntryDialog}
        onOpenChange={setShowImeiEntryDialog}
        requiredCount={formData.quantity}
        onConfirm={(imeis) => {
          console.log('[InventoryAdjustmentDialog] IMEI entry confirmed:', imeis.length, 'IMEIs');
          const deviceImeis: DeviceImeiInput[] = imeis.map((i) => ({
            imeiNumber: i.imeiNumber,
            notes: i.notes,
          }));
          submitAdjustment(deviceImeis);
        }}
        productName={item?.product?.name || "Product"}
      />

      {/* IMEI Selection Dialog (for DECREASE) */}
      <ImeiSelectionDialog
        open={showImeiSelectionDialog}
        onOpenChange={setShowImeiSelectionDialog}
        productId={item?.productId || ""}
        productName={item?.product?.name || "Product"}
        batchId={item?.batchId || undefined}
        location={item?.location}
        requiredCount={formData.quantity}
        onConfirm={(selectedImeis) => {
          console.log('[InventoryAdjustmentDialog] IMEI selection confirmed:', selectedImeis.length, 'IMEIs');
          submitAdjustment(selectedImeis);
        }}
      />
    </>
  );
};

export default InventoryAdjustmentDialog;
