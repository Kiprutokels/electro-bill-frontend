import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, Smartphone } from "lucide-react";
import { Product } from "@/api/services/products.service";
import {
  productBatchesService,
  CreateProductBatchRequest,
  ProductBatch,
} from "@/api/services/productBatches.service";
import { validateNumber, validateDecimal } from "@/utils/validation.utils";
import { toast } from "sonner";
import ImeiEntryDialog from "@/components/inventory/ImeiEntryDialog";
import { DeviceImeiInput } from "@/api/types/device.types";
import { devicesService } from "@/api/services/devices.service";

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

  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [createdBatch, setCreatedBatch] = useState<ProductBatch | null>(null);

  const [trackImeis, setTrackImeis] = useState(false);

  const [formData, setFormData] = useState<
    Omit<CreateProductBatchRequest, "productId">
  >({
    supplierBatchRef: "",
    buyingPrice: 0,
    quantityReceived: 0,
    expiryDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const buyingPriceError = validateDecimal(
      formData.buyingPrice,
      "Buying price",
      { min: 0 },
    );
    if (buyingPriceError) newErrors.buyingPrice = buyingPriceError;

    const quantityError = validateNumber(
      formData.quantityReceived,
      "Quantity received",
      { min: 1 },
    );
    if (quantityError) newErrors.quantityReceived = quantityError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      supplierBatchRef: "",
      buyingPrice: 0,
      quantityReceived: 0,
      expiryDate: "",
      notes: "",
    });
    setErrors({});
    setTrackImeis(false);
    setCreatedBatch(null);
    setShowImeiDialog(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      const batchData: CreateProductBatchRequest = {
        ...formData,
        productId: product.id,
        supplierBatchRef: formData.supplierBatchRef || undefined,
        expiryDate: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
      };

      const batch = await productBatchesService.create(batchData);

      toast.success("Batch created successfully");
      onRestockComplete();

      if (trackImeis && formData.quantityReceived > 0) {
        setCreatedBatch(batch);
        setShowImeiDialog(true);
        return;
      }

      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to add stock";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImeis = async (
    imeis: { imeiNumber: string; notes?: string }[],
  ) => {
    if (!product || !createdBatch) return;

    if (trackImeis && imeis.length !== formData.quantityReceived) {
      toast.error(
        `Please add exactly ${formData.quantityReceived} IMEI numbers`,
      );
      return;
    }

    if (imeis.length === 0) {
      toast.success("Stock saved without IMEIs");
      setShowImeiDialog(false);
      setCreatedBatch(null);
      onOpenChange(false);
      resetForm();
      return;
    }

    setLoading(true);
    try {
      const devices: DeviceImeiInput[] = imeis.map((i) => ({
        imeiNumber: i.imeiNumber,
        notes: i.notes,
      }));

      await devicesService.bulkCreateForBatch(createdBatch.id, {
        productId: product.id,
        devices,
      });

      toast.success(
        `Saved ${devices.length} device IMEIs for batch ${createdBatch.batchNumber}`,
      );

      setShowImeiDialog(false);
      setCreatedBatch(null);

      onOpenChange(false);
      resetForm();

      onRestockComplete();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save devices";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && showImeiDialog && trackImeis) {
            toast.error("Please finish IMEI entry before closing");
            return;
          }
          onOpenChange(nextOpen);
          if (!nextOpen) resetForm();
        }}
      >
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
                <span className="font-medium">Current Stock:</span>{" "}
                {product?.totalQuantity || 0} units
              </p>
            </div>

            <div>
              <Label htmlFor="supplierBatchRef">Supplier Batch Reference</Label>
              <Input
                id="supplierBatchRef"
                value={formData.supplierBatchRef}
                onChange={(e) =>
                  handleInputChange("supplierBatchRef", e.target.value)
                }
                placeholder="e.g., SUP-REF-001"
              />
            </div>

            <div>
              <Label htmlFor="buyingPrice">
                Buying Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="buyingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.buyingPrice}
                onChange={(e) =>
                  handleInputChange(
                    "buyingPrice",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className={errors.buyingPrice ? "border-destructive" : ""}
              />
              {errors.buyingPrice && (
                <p className="text-sm text-destructive mt-1">
                  {errors.buyingPrice}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantityReceived">
                Quantity Received <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantityReceived"
                type="number"
                min="1"
                value={formData.quantityReceived}
                onChange={(e) =>
                  handleInputChange(
                    "quantityReceived",
                    parseInt(e.target.value) || 0,
                  )
                }
                className={errors.quantityReceived ? "border-destructive" : ""}
              />
              {errors.quantityReceived && (
                <p className="text-sm text-destructive mt-1">
                  {errors.quantityReceived}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                checked={trackImeis}
                onCheckedChange={(v) => setTrackImeis(Boolean(v))}
                id="trackImeis"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="trackImeis"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  Track IMEIs for this batch
                </Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, IMEI entry will open immediately after saving, and
                  you must enter exactly the same number of IMEIs as the
                  quantity received.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  handleInputChange("expiryDate", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes (optional)"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? "Saving..."
                  : trackImeis
                    ? "Save & Add IMEIs"
                    : "Add Stock"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ImeiEntryDialog
        open={showImeiDialog}
        onOpenChange={(v) => {
          if (!v && trackImeis) {
            toast.error("IMEI entry is required for this batch");
            return;
          }
          setShowImeiDialog(v);
        }}
        requiredCount={formData.quantityReceived}
        productName={product?.name || "Product"}
        allowSkip={!trackImeis}
        onConfirm={handleConfirmImeis}
      />
    </>
  );
};

export default RestockDialog;
