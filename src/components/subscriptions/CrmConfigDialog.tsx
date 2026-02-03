import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscriptionsService, Subscription } from "@/api/services/subscriptions.service";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CrmConfigDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscription: Subscription | null;
  onSuccess: (updated: Subscription) => void;
}) {
  const [saving, setSaving] = useState(false);

  const [crmStatus, setCrmStatus] = useState<string>("ACTIVE");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [followUpFrequencyMonths, setFollowUpFrequencyMonths] = useState<string>("");
  const [followUpTimesPerYear, setFollowUpTimesPerYear] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  useEffect(() => {
    if (!open || !subscription) return;

    setCrmStatus(subscription.crmStatus ?? "ACTIVE");
    setPriority(subscription.priority ?? "NORMAL");
    setFollowUpFrequencyMonths(subscription.followUpFrequencyMonths?.toString() ?? "");
    setFollowUpTimesPerYear(subscription.followUpTimesPerYear?.toString() ?? "");

    try {
      const parsed = subscription.tags ? JSON.parse(subscription.tags) : [];
      setTags(Array.isArray(parsed) ? parsed.join(", ") : "");
    } catch {
      setTags("");
    }
  }, [open, subscription?.id]);

  const canSave = useMemo(() => !!subscription?.id, [subscription?.id]);

  const handleSave = async () => {
    if (!subscription?.id) return;
    setSaving(true);
    try {
      const tagsArr = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await subscriptionsService.updateCrmConfig(subscription.id, {
        crmStatus: crmStatus as any,
        priority: priority as any,
        followUpFrequencyMonths: followUpFrequencyMonths ? Number(followUpFrequencyMonths) : undefined,
        followUpTimesPerYear: followUpTimesPerYear ? Number(followUpTimesPerYear) : undefined,
        tags: tagsArr.length ? tagsArr : undefined,
      });

      toast.success("CRM config updated (next follow-up recalculated)");
      onSuccess(updated);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update CRM config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CRM Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Subscription: <span className="font-mono">{subscription?.subscriptionNumber}</span>
          </div>

          <Select value={crmStatus} onValueChange={setCrmStatus}>
            <SelectTrigger><SelectValue placeholder="CRM Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="PAUSED">PAUSED</SelectItem>
              <SelectItem value="AT_RISK">AT_RISK</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">NORMAL</SelectItem>
              <SelectItem value="HIGH_VALUE">HIGH_VALUE</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Follow-up frequency months (preferred)"
            value={followUpFrequencyMonths}
            onChange={(e) => setFollowUpFrequencyMonths(e.target.value)}
          />

          <Input
            placeholder="OR follow-up times per year (fallback)"
            value={followUpTimesPerYear}
            onChange={(e) => setFollowUpTimesPerYear(e.target.value)}
          />

          <Input
            placeholder="Tags (comma separated) e.g. VIP, Fleet, Renewal"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
