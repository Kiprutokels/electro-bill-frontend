import { useState, useEffect } from "react";
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
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  locationsService,
  WarehouseLocation,
} from "@/api/services/locations.service";
import { InventoryItem } from "@/api/services/inventory.service";
import { toast } from "sonner";
import ImeiSelectionDialog from "./ImeiSelectionDialog";

interface TransferInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

const TransferInventoryDialog = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}: TransferInventoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showImeiSelectionDialog, setShowImeiSelectionDialog] = useState(false);

  const [formData, setFormData] = useState({
    toLocation: "",
    quantity: "",
    reason: "",
  });

  const availableQuantity = item?.quantityAvailable || 0;
  const isTracked = item?.product?.isImeiTracked || false;
  const quantityValue = formData.quantity ? parseInt(formData.quantity) : 0;
  const isQuantityValid =
    quantityValue > 0 && quantityValue <= availableQuantity;

  console.log(
    "[TransferInventoryDialog] Item:",
    item?.product?.name,
    "isTracked:",
    isTracked,
    "availableQuantity:",
    availableQuantity,
  );

  useEffect(() => {
    if (open) {
      console.log(
        "[TransferInventoryDialog] Dialog opened, fetching locations",
      );
      fetchLocations();
      // Reset form with empty quantity
      setFormData({ toLocation: "", quantity: "", reason: "" });
    }
  }, [open]);

  const fetchLocations = async () => {
    console.log("[TransferInventoryDialog] Fetching active locations");
    setLoadingLocations(true);
    try {
      const data = await locationsService.getAll(false);
      console.log(
        "[TransferInventoryDialog] Fetched",
        data.length,
        "locations",
      );
      setLocations(data.filter((loc) => loc.isActive));
    } catch (err: any) {
      console.error("[TransferInventoryDialog] Fetch locations error:", err);
      toast.error("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const submitTransfer = async (selectedImeis: string[]) => {
    if (!item) return;

    console.log(
      "[TransferInventoryDialog] Submitting transfer with",
      selectedImeis.length,
      "IMEIs",
    );

    setLoading(true);
    try {
      const payload = {
        productId: item.productId,
        batchId: item.batchId || undefined,
        fromLocation: item.location,
        toLocation: formData.toLocation,
        quantity: quantityValue,
        deviceImeis:
          isTracked && selectedImeis.length > 0
            ? selectedImeis.map((imei) => ({ imeiNumber: imei }))
            : undefined,
        reason: formData.reason,
      };

      console.log("[TransferInventoryDialog] Transfer payload:", payload);

      const result = await locationsService.transferInventory(payload);
      console.log("[TransferInventoryDialog] Transfer successful:", result);

      toast.success(result.message);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("[TransferInventoryDialog] Transfer error:", err);
      toast.error(
        err.response?.data?.message || "Failed to transfer inventory",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    console.log(
      "[TransferInventoryDialog] Form submitted, quantity:",
      quantityValue,
    );

    if (!formData.toLocation || !formData.quantity || !formData.reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.toLocation === item.location) {
      toast.error("Destination location must be different from source");
      return;
    }

    if (!isQuantityValid) {
      toast.error(`Quantity must be between 1 and ${availableQuantity}`);
      return;
    }

    // If tracked product, open IMEI selection dialog
    if (isTracked) {
      console.log(
        "[TransferInventoryDialog] Opening IMEI selection dialog for",
        quantityValue,
        "devices",
      );
      setShowImeiSelectionDialog(true);
    } else {
      // Non-tracked: submit directly
      console.log(
        "[TransferInventoryDialog] Non-tracked product: submitting directly",
      );
      await submitTransfer([]);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or positive integers only
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({ ...formData, quantity: value });
    }
  };

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Inventory</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Info */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <span className="text-sm font-medium">Product:</span>{" "}
                <span className="text-sm">
                  {item.product?.name || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Current Location:</span>{" "}
                <span className="text-sm">{item.location || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Available Quantity:</span>{" "}
                <span className="text-sm font-bold text-emerald-600">
                  {availableQuantity} unit(s)
                </span>
              </div>
              {isTracked && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    IMEI-Tracked Product - Device Selection Required
                  </span>
                </div>
              )}
            </div>

            {/* Destination Location */}
            <div className="space-y-2">
              <Label htmlFor="toLocation">
                Destination Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.toLocation}
                onValueChange={(value) =>
                  setFormData({ ...formData, toLocation: value })
                }
                disabled={loading || loadingLocations}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.code !== item.location)
                    .map((loc) => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity to Transfer <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter quantity (e.g., 5)"
                  value={formData.quantity}
                  onChange={handleQuantityChange}
                  disabled={loading}
                  required
                  className={
                    formData.quantity
                      ? isQuantityValid
                        ? "border-emerald-500 pr-10"
                        : "border-red-500 pr-10"
                      : ""
                  }
                />
                {formData.quantity && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isQuantityValid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Available:{" "}
                  <span className="font-semibold text-foreground">
                    {availableQuantity} unit(s)
                  </span>
                </p>
                {formData.quantity && !isQuantityValid && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ Quantity must be between 1 and {availableQuantity}
                  </p>
                )}
                {formData.quantity && isQuantityValid && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓{" "}
                    {isTracked
                      ? `You will select ${quantityValue} device(s) in the next step`
                      : `Valid quantity`}
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Transfer Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="e.g., Transfer to Eldoret branch for regional sales"
                rows={3}
                disabled={loading}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !isQuantityValid ||
                  !formData.toLocation ||
                  !formData.reason.trim()
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? "Processing..."
                  : isTracked
                    ? "Select Devices"
                    : "Transfer Inventory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMEI Selection Dialog (for tracked products) */}
      <ImeiSelectionDialog
        open={showImeiSelectionDialog}
        onOpenChange={setShowImeiSelectionDialog}
        productId={item?.productId || ""}
        productName={item?.product?.name || "Product"}
        batchId={item?.batchId || undefined}
        location={item?.location}
        requiredCount={quantityValue}
        onConfirm={(selectedImeis) => {
          console.log(
            "[TransferInventoryDialog] IMEI selection confirmed:",
            selectedImeis.length,
            "IMEIs",
          );
          setShowImeiSelectionDialog(false);
          submitTransfer(selectedImeis);
        }}
      />
    </>
  );
};

export default TransferInventoryDialog;
