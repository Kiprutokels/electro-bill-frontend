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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Loader2 } from "lucide-react";
import {
  ProductBatch,
  UpdateProductBatchRequest,
  productBatchesService,
} from "@/api/services/productBatches.service";
import { formatCurrency } from "@/utils/format.utils";
import { toast } from "sonner";

interface EditProductBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
  onBatchUpdated: (batch: ProductBatch) => void;
}

const EditProductBatchDialog: React.FC<EditProductBatchDialogProps> = ({
  open,
  onOpenChange,
  batch,
  onBatchUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProductBatchRequest>({
    supplierBatchRef: "",
    buyingPrice: 0,
    expiryDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (batch && open) {
      const expiryDate = batch.expiryDate
        ? new Date(batch.expiryDate).toISOString().split("T")[0]
        : "";

      setFormData({
        supplierBatchRef: batch.supplierBatchRef || "",
        buyingPrice: Number(batch.buyingPrice),
        expiryDate: expiryDate,
        notes: batch.notes || "",
      });
      setErrors({});
    }
  }, [batch, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.buyingPrice !== undefined && formData.buyingPrice <= 0) {
      newErrors.buyingPrice = "Buying price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !batch) {
      return;
    }

    setLoading(true);
    try {
      const requestData: UpdateProductBatchRequest = {
        ...formData,
        supplierBatchRef: formData.supplierBatchRef || undefined,
        expiryDate: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
      };

      const updatedBatch = await productBatchesService.update(batch.id, requestData);
      onBatchUpdated(updatedBatch);
      onOpenChange(false);
      toast.success("Product batch updated successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update batch";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!batch) return null;

  const totalAvailable = batch.inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Product Batch - {batch.batchNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Batch Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-mono bg-muted px-2 py-1 rounded">
                    {batch.batchNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{batch.product?.name || "Unknown Product"}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {batch.product?.sku || "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity Received</p>
                  <p className="font-medium">{batch.quantityReceived} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Quantity</p>
                  <p className="font-medium">{totalAvailable} units</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Batch Reference */}
            <div className="space-y-2">
              <Label htmlFor="supplierBatchRef">Supplier Batch Reference</Label>
              <Input
                id="supplierBatchRef"
                value={formData.supplierBatchRef}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplierBatchRef: e.target.value }))
                }
                placeholder="Enter supplier reference"
              />
            </div>

            {/* Buying Price */}
            <div className="space-y-2">
              <Label htmlFor="buyingPrice">Buying Price per Unit</Label>
              <Input
                id="buyingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.buyingPrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    buyingPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className={errors.buyingPrice ? "border-destructive" : ""}
              />
              {errors.buyingPrice && (
                <p className="text-sm text-destructive">{errors.buyingPrice}</p>
              )}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
              }
            />
          </div>

          {/* Cost Summary */}
          {formData.buyingPrice && formData.buyingPrice > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Updated Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                    <p className="font-medium">{formatCurrency(formData.buyingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Quantity</p>
                    <p className="font-medium">{totalAvailable} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(formData.buyingPrice * totalAvailable)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this batch (optional)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Updating Batch..." : "Update Batch"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductBatchDialog;