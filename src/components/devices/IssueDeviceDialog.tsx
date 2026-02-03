import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Device } from "@/api/types/device.types";
import { devicesService } from "@/api/services/devices.service";
import { toast } from "sonner";

interface IssueDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  currentUserId: string; // from auth context
  onIssued: (device: Device) => void;
}

const IssueDeviceDialog = ({ open, onOpenChange, device, currentUserId, onIssued }: IssueDeviceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [requisitionItemId, setRequisitionItemId] = useState("");

  useEffect(() => {
    if (!open) return;
    console.log("[IssueDeviceDialog] Opened for:", device?.imeiNumber);
    setRequisitionItemId("");
  }, [open, device]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    if (!requisitionItemId.trim()) {
      toast.error("Requisition Item ID is required");
      return;
    }

    console.log("[IssueDeviceDialog] Issuing device:", {
      imei: device.imeiNumber,
      requisitionItemId,
      issuedBy: currentUserId,
    });

    setLoading(true);
    try {
      const updated = await devicesService.issue(device.imeiNumber, {
        requisitionItemId: requisitionItemId.trim(),
        issuedBy: currentUserId,
      });

      toast.success("Device issued successfully");
      onIssued(updated);
      onOpenChange(false);
    } catch (err: any) {
      console.error("[IssueDeviceDialog] Issue error:", err);
      toast.error(err?.response?.data?.message || "Failed to issue device");
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Device: {device.imeiNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Requisition Item ID <span className="text-red-500">*</span>
            </Label>
            <Input
              value={requisitionItemId}
              onChange={(e) => setRequisitionItemId(e.target.value)}
              placeholder="requisition-item-uuid"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDeviceDialog;