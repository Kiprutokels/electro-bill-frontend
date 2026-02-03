import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Device } from "@/api/types/device.types";
import { toast } from "sonner";

type ActionType = "DAMAGED" | "RETURNED" | "DEACTIVATE";

interface DeviceNoteActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  action: ActionType;
  onConfirm: (notes?: string) => Promise<void>;
}

const titleMap: Record<ActionType, string> = {
  DAMAGED: "Mark Device as Damaged",
  RETURNED: "Mark Device as Returned",
  DEACTIVATE: "Deactivate Device",
};

const DeviceNoteActionDialog = ({ open, onOpenChange, device, action, onConfirm }: DeviceNoteActionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    console.log("[DeviceNoteActionDialog] Opened:", { action, imei: device?.imeiNumber });
    setNotes("");
  }, [open, action, device]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    console.log("[DeviceNoteActionDialog] Confirming action:", { action, imei: device.imeiNumber, notes });

    setLoading(true);
    try {
      await onConfirm(notes.trim() || undefined);
      toast.success("Action completed");
      onOpenChange(false);
    } catch (err: any) {
      console.error("[DeviceNoteActionDialog] Action error:", err);
      toast.error(err?.response?.data?.message || "Failed to perform action");
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titleMap[action]}: {device.imeiNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Add notes for audit trail..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceNoteActionDialog;