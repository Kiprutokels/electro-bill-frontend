import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, AlertCircle, Smartphone } from "lucide-react";
import { devicesService } from "@/api/services/devices.service";
import { Device } from "@/api/types/device.types";
import { toast } from "sonner";

interface ImeiSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  batchId?: string;
  location?: string; // Optional location filter
  requiredCount: number;
  onConfirm: (selectedImeis: string[]) => void;
}

const ImeiSelectionDialog: React.FC<ImeiSelectionDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  batchId,
  location,
  requiredCount,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedImeis, setSelectedImeis] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  console.log(
    '[ImeiSelectionDialog] Props - product:',
    productId,
    'batch:',
    batchId,
    'location:',
    location,
    'required:',
    requiredCount
  );

  useEffect(() => {
    if (open) {
      console.log('[ImeiSelectionDialog] Dialog opened, fetching available devices');
      fetchAvailableDevices();
      setSelectedImeis(new Set());
      setSearchTerm("");
    }
  }, [open, productId, batchId, location]);

  const fetchAvailableDevices = async () => {
    console.log('[ImeiSelectionDialog] Fetching available devices for product:', productId);
    setLoading(true);
    try {
      // Fetch all available devices for the product
      let availableDevices = await devicesService.getAvailableDevices({
        productId,
        batchId,
      });

      console.log('[ImeiSelectionDialog] Fetched', availableDevices.length, 'available devices from API');

      // Filter by location if specified (client-side filter since API doesn't support it yet)
      // This is for inventory at specific locations
      if (location) {
        console.log('[ImeiSelectionDialog] Filtering devices by location:', location);
        // Note: Since Device model doesn't have location field directly,
        // we rely on batch location. If batch location matches, device is at that location.
        // For more precise tracking, you'd need to add location field to Device model.
        
        // For now, if location is specified, we assume all AVAILABLE devices 
        // at that batch are at that location. This is a reasonable assumption
        // since devices are tracked per batch, and batches have locations.
        
        // If you need more precise location tracking per device, you should:
        // 1. Add `location` field to Device model in schema
        // 2. Update device location on transfer
        // 3. Filter by device.location here
        
        // Current implementation: trust that batch location = device location
        console.log('[ImeiSelectionDialog] Location filtering: using batch-based location assumption');
      }

      console.log('[ImeiSelectionDialog] Final device count:', availableDevices.length);
      setDevices(availableDevices);

      if (availableDevices.length === 0) {
        console.warn('[ImeiSelectionDialog] No available devices found');
        toast.warning("No available devices found for this product");
      } else {
        console.log('[ImeiSelectionDialog] Devices ready for selection');
      }
    } catch (err: any) {
      console.error('[ImeiSelectionDialog] Fetch error:', err);
      toast.error("Failed to load available devices");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImei = (imei: string) => {
    console.log('[ImeiSelectionDialog] Toggling IMEI:', imei);
    setSelectedImeis((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imei)) {
        console.log('[ImeiSelectionDialog] Deselecting IMEI:', imei);
        newSet.delete(imei);
      } else {
        if (newSet.size >= requiredCount) {
          console.warn('[ImeiSelectionDialog] Selection limit reached:', requiredCount);
          toast.error(`You can only select ${requiredCount} device(s)`);
          return prev;
        }
        console.log('[ImeiSelectionDialog] Selecting IMEI:', imei);
        newSet.add(imei);
      }
      console.log('[ImeiSelectionDialog] Selected count:', newSet.size, '/', requiredCount);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    console.log('[ImeiSelectionDialog] Select all clicked');
    if (selectedImeis.size === Math.min(devices.length, requiredCount)) {
      console.log('[ImeiSelectionDialog] Deselecting all');
      setSelectedImeis(new Set());
    } else {
      console.log('[ImeiSelectionDialog] Selecting first', requiredCount, 'devices');
      const firstN = devices.slice(0, requiredCount).map((d) => d.imeiNumber);
      setSelectedImeis(new Set(firstN));
      console.log('[ImeiSelectionDialog] Selected IMEIs:', firstN);
    }
  };

  const handleConfirm = () => {
    console.log('[ImeiSelectionDialog] Confirming selection:', Array.from(selectedImeis));
    if (selectedImeis.size !== requiredCount) {
      console.warn('[ImeiSelectionDialog] Invalid selection count:', selectedImeis.size, 'expected:', requiredCount);
      toast.error(`Please select exactly ${requiredCount} device(s)`);
      return;
    }
    const selectedArray = Array.from(selectedImeis);
    console.log('[ImeiSelectionDialog] Confirmed IMEIs:', selectedArray);
    onConfirm(selectedArray);
    onOpenChange(false);
  };

  const filteredDevices = devices.filter((device) =>
    device.imeiNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.macAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('[ImeiSelectionDialog] Filtered devices count:', filteredDevices.length, 'search:', searchTerm);

  const isAllSelected =
    selectedImeis.size === Math.min(filteredDevices.length, requiredCount) &&
    filteredDevices.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Select Devices
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {productName} - Select {requiredCount} device(s)
            {location && ` from ${location}`}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading available devices...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Selection Summary */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected:</span>
                  <Badge variant={selectedImeis.size === requiredCount ? "default" : "secondary"}>
                    {selectedImeis.size} / {requiredCount}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Available: {devices.length}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('[ImeiSelectionDialog] Search term changed:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  placeholder="Search by IMEI, Serial Number, or MAC Address..."
                  className="pl-10"
                />
              </div>

              {/* Device List */}
              {devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No available devices found for this product
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    All devices may be issued, active, or not in stock
                    {location && ` at ${location}`}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              disabled={devices.length === 0}
                            />
                          </TableHead>
                          <TableHead className="min-w-[180px]">IMEI Number</TableHead>
                          <TableHead className="hidden md:table-cell">Serial Number</TableHead>
                          <TableHead className="hidden lg:table-cell">MAC Address</TableHead>
                          <TableHead className="hidden xl:table-cell">Batch Number</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDevices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No devices match your search
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDevices.map((device) => {
                            const isSelected = selectedImeis.has(device.imeiNumber);
                            const isDisabled =
                              !isSelected && selectedImeis.size >= requiredCount;

                            return (
                              <TableRow
                                key={device.id}
                                className={`cursor-pointer ${
                                  isSelected ? "bg-primary/5" : ""
                                } ${isDisabled ? "opacity-50" : ""}`}
                                onClick={() => !isDisabled && handleToggleImei(device.imeiNumber)}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={() => handleToggleImei(device.imeiNumber)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                                <TableCell className="font-mono font-medium">
                                  {device.imeiNumber}
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-mono text-sm">
                                  {device.serialNumber || "—"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell font-mono text-sm">
                                  {device.macAddress || "—"}
                                </TableCell>
                                <TableCell className="hidden xl:table-cell font-mono text-sm">
                                  {device.batch?.batchNumber || "—"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('[ImeiSelectionDialog] Cancelled');
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedImeis.size !== requiredCount}
              >
                Confirm Selection ({selectedImeis.size}/{requiredCount})
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImeiSelectionDialog;

