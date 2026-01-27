import React, { useState, useEffect } from "react";
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
import { Loader2, Smartphone, CheckCircle } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      fetchAvailable();
      setSelectedImeis([]);
    }
  }, [open, productId, batchId]);

  const fetchAvailable = async () => {
    setLoading(true);
    try {
      const devices = await devicesService.getAvailableDevices({ productId, batchId });
      setAvailableDevices(devices);
    } catch (error) {
      console.error("Failed to fetch available devices:", error);
      toast.error("Failed to load available devices");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (imeiNumber: string) => {
    if (selectedImeis.includes(imeiNumber)) {
      setSelectedImeis(selectedImeis.filter((i) => i !== imeiNumber));
      return;
    }

    if (selectedImeis.length >= requiredCount) {
      toast.error(`You can only select ${requiredCount} device(s)`);
      return;
    }

    setSelectedImeis([...selectedImeis, imeiNumber]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Select Devices
          </DialogTitle>
          <DialogDescription>
            Select <strong>{requiredCount}</strong> device(s) for{" "}
            <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {selectedImeis.length} / {requiredCount} selected
            </Badge>
            <Badge
              variant={availableDevices.length >= requiredCount ? "default" : "destructive"}
            >
              {availableDevices.length} available
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : availableDevices.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No AVAILABLE devices found for this product{batchId ? "/batch" : ""}.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add devices during restock or via the Devices page.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {availableDevices.map((d) => {
                const isSelected = selectedImeis.includes(d.imeiNumber);
                return (
                  <div
                    key={d.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => handleToggle(d.imeiNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(d.imeiNumber)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{d.imeiNumber}</span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Added: {formatDate(d.createdAt)}
                          {d.notes && <span className="ml-2">• {d.notes}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {allowSkip && (
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip (No Selection)
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedImeis.length === 0 || loading}
          >
            Confirm ({selectedImeis.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceSelectionDialog;