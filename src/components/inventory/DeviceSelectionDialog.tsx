import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone, CheckCircle, Search, Info } from "lucide-react";
import { devicesService } from "@/api/services/devices.service";
import { Device } from "@/api/types/device.types";
import { formatDate } from "@/utils/format.utils";
import { toast } from "sonner";

interface DeviceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  batchId?: string;
  requiredCount: number;
  onConfirm: (selectedImeis: string[]) => void;
  allowSkip?: boolean;
}

const DeviceSelectionDialog: React.FC<DeviceSelectionDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  batchId,
  requiredCount,
  onConfirm,
  allowSkip = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedImeis([]);
    setQuery("");
    fetchAvailable();
  }, [open, productId, batchId]);

  const fetchAvailable = async () => {
    setLoading(true);
    try {
      const devices = await devicesService.getAvailableDevices({
        productId,
        batchId,
      });
      setAvailableDevices(devices);
    } catch (error) {
      console.error("Failed to fetch available devices:", error);
      toast.error("Failed to load available devices");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableDevices;
    return availableDevices.filter((d) =>
      d.imeiNumber.toLowerCase().includes(q),
    );
  }, [availableDevices, query]);

  const handleToggle = (imeiNumber: string) => {
    setSelectedImeis((prev) => {
      if (prev.includes(imeiNumber))
        return prev.filter((i) => i !== imeiNumber);
      if (prev.length >= requiredCount) {
        toast.error(`You can only select ${requiredCount} device(s)`);
        return prev;
      }
      return [...prev, imeiNumber];
    });
  };

  const handleConfirm = () => {
    if (selectedImeis.length !== requiredCount) {
      toast.error(`Please select exactly ${requiredCount} device(s)`);
      return;
    }
    onConfirm(selectedImeis);
    onOpenChange(false);
  };

  const handleSkip = () => {
    if (!allowSkip) {
      toast.error("Device selection is required");
      return;
    }
    onConfirm([]);
    onOpenChange(false);
  };

  const selectedCount = selectedImeis.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Select Devices (IMEIs)
          </DialogTitle>
          <DialogDescription>
            Product: <strong>{productName}</strong>
            {batchId ? (
              <>
                {" "}
                • Batch: <span className="font-mono text-xs">{batchId}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 flex-wrap py-2">
          <Badge variant="secondary">
            Selected {selectedCount} / {requiredCount}
          </Badge>
          <Badge
            variant={
              availableDevices.length >= requiredCount
                ? "default"
                : "destructive"
            }
          >
            {availableDevices.length} AVAILABLE
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IMEI..."
            className="pl-10"
            disabled={loading || availableDevices.length === 0}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : availableDevices.length === 0 ? (
            <div className="text-center py-10 px-3">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No <strong>AVAILABLE</strong> devices found for this product
                {batchId ? " / selected batch" : ""}.
              </p>

              <div className="mt-4 p-3 rounded-lg border bg-muted/30 text-left text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Common reason</div>
                    <div className="text-muted-foreground">
                      Inventory can show quantity remaining, but if IMEI rows
                      were not stocked (Devices table), the picker will be
                      empty. Bulk-create IMEIs for the batch.
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="mt-5"
                variant="outline"
                onClick={fetchAvailable}
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No results for “{query}”
                </div>
              ) : (
                filtered.map((d) => {
                  const isSelected = selectedImeis.includes(d.imeiNumber);
                  const disabled =
                    !isSelected && selectedImeis.length >= requiredCount;

                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => !disabled && handleToggle(d.imeiNumber)}
                      className={[
                        "w-full text-left p-3 transition-colors",
                        "hover:bg-muted/50",
                        isSelected
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : "",
                        disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            !disabled && handleToggle(d.imeiNumber)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-sm">
                              {d.imeiNumber}
                            </span>
                            {isSelected && (
                              <Badge className="bg-primary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            Added: {formatDate(d.createdAt)}
                            {d.notes ? (
                              <span className="ml-2">• {d.notes}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 pt-3 border-t">
          {allowSkip && (
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          )}

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || selectedImeis.length !== requiredCount}
          >
            Confirm ({selectedImeis.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceSelectionDialog;
