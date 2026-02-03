import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { crmFollowupsService } from "@/api/services/crm-followups.service";
import { useAuth } from "@/contexts/AuthContext";

export default function SmartCreateFollowUpDialog({
  open,
  onOpenChange,
  customerId,
  subscriptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  subscriptions: any[];
}) {
  const { user } = useAuth();
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [title, setTitle] = useState("Follow-up");
  const [dueDate, setDueDate] = useState(new Date().toISOString());
  const [saving, setSaving] = useState(false);

  const assignedTo = user?.id;

  const canSave = useMemo(() => !!subscriptionId && !!assignedTo, [subscriptionId, assignedTo]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await crmFollowupsService.create({
        subscriptionId,
        customerId,
        assignedTo,
        title,
        dueDate,
        priority: "NORMAL",
      });
      toast.success("Follow-up created");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create follow-up");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <Select value={subscriptionId} onValueChange={setSubscriptionId}>
            <SelectTrigger><SelectValue placeholder="Select subscription" /></SelectTrigger>
            <SelectContent>
              {subscriptions.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.subscriptionNumber} • {s.product?.name ?? "Product"} • {s.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Due date (ISO)" />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Saving..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
