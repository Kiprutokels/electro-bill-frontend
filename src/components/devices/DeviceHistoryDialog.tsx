import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { Device, DeviceHistoryResponse } from "@/api/types/device.types";
import { devicesService } from "@/api/services/devices.service";
import { formatDate } from "@/utils/format.utils";
import { toast } from "sonner";

interface DeviceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
}

const DeviceHistoryDialog = ({ open, onOpenChange, device }: DeviceHistoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeviceHistoryResponse | null>(null);

  useEffect(() => {
    if (!open || !device) return;

    console.log("[DeviceHistoryDialog] Fetching history for:", device.imeiNumber);

    const run = async () => {
      setLoading(true);
      try {
        const res = await devicesService.history(device.imeiNumber);
        console.log("[DeviceHistoryDialog] History loaded events:", res.lifecycle?.length);
        setData(res);
      } catch (err: any) {
        console.error("[DeviceHistoryDialog] History error:", err);
        toast.error(err?.response?.data?.message || "Failed to load device history");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [open, device]);

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device History: {device.imeiNumber}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-10 text-muted-foreground">No history found.</div>
        ) : (
          <div className="space-y-3">
            {(data.lifecycle || []).map((e, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{e.event}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(e.date)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {e.details || "—"}
                </div>
                {(e.jobNumber || e.location) && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {e.jobNumber ? <>Job: <span className="font-mono">{e.jobNumber}</span></> : null}
                    {e.jobNumber && e.location ? " • " : null}
                    {e.location ? <>Location: <span className="font-mono">{e.location}</span></> : null}
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;