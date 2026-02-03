import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Device } from "@/api/types/device.types";
import { devicesService } from "@/api/services/devices.service";
import { toast } from "sonner";

interface ActivateDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onActivated: (device: Device) => void;
}

const ActivateDeviceDialog = ({ open, onOpenChange, device, onActivated }: ActivateDeviceDialogProps) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    simCardIccid: "",
    simCardImsi: "",
    macAddress: "",
    installationAddress: "",
    installationPerson: "",
    installationCompany: "",
  });

  useEffect(() => {
    if (!open || !device) return;

    console.log("[ActivateDeviceDialog] Opened for:", device.imeiNumber);

    setForm({
      simCardIccid: device.simCardIccid ?? "",
      simCardImsi: device.simCardImsi ?? "",
      macAddress: device.macAddress ?? "",
      installationAddress: device.installationAddress ?? "",
      installationPerson: device.installationPerson ?? "",
      installationCompany: device.installationCompany ?? "",
    });
  }, [open, device]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    console.log("[ActivateDeviceDialog] Activating device:", { imei: device.imeiNumber, form });

    setLoading(true);
    try {
      const updated = await devicesService.activate(device.imeiNumber, {
        simCardIccid: form.simCardIccid || undefined,
        simCardImsi: form.simCardImsi || undefined,
        macAddress: form.macAddress || undefined,
        installationAddress: form.installationAddress || undefined,
        installationPerson: form.installationPerson || undefined,
        installationCompany: form.installationCompany || undefined,
      });

      toast.success("Device activated");
      onActivated(updated);
      onOpenChange(false);
    } catch (err: any) {
      console.error("[ActivateDeviceDialog] Activate error:", err);
      toast.error(err?.response?.data?.message || "Failed to activate device");
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activate Device: {device.imeiNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SIM ICCID</Label>
              <Input
                value={form.simCardIccid}
                onChange={(e) => setForm((p) => ({ ...p, simCardIccid: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>SIM IMSI</Label>
              <Input
                value={form.simCardImsi}
                onChange={(e) => setForm((p) => ({ ...p, simCardImsi: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>MAC Address</Label>
              <Input
                value={form.macAddress}
                onChange={(e) => setForm((p) => ({ ...p, macAddress: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Installation Address</Label>
            <Textarea
              rows={3}
              value={form.installationAddress}
              onChange={(e) => setForm((p) => ({ ...p, installationAddress: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Installation Person</Label>
              <Input
                value={form.installationPerson}
                onChange={(e) => setForm((p) => ({ ...p, installationPerson: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Installation Company</Label>
              <Input
                value={form.installationCompany}
                onChange={(e) => setForm((p) => ({ ...p, installationCompany: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivateDeviceDialog;