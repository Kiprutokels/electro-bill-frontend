import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscriptionsService, Subscription } from "@/api/services/subscriptions.service";
import { usersService } from "@/api/services/users.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AssignOwnerDialog({
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
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const [accountOwnerId, setAccountOwnerId] = useState<string>("");
  const [followUpFrequencyMonths, setFollowUpFrequencyMonths] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    setAccountOwnerId(subscription?.accountOwnerId ?? "");
    setFollowUpFrequencyMonths(subscription?.followUpFrequencyMonths?.toString() ?? "");

    (async () => {
      setLoadingUsers(true);
      try {
        const res = await usersService.getUsers({ page: 1, limit: 100 });
        setUsers(res.data);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open, subscription?.id]);

  const canSave = useMemo(() => !!accountOwnerId && !!subscription?.id, [accountOwnerId, subscription?.id]);

  const handleSave = async () => {
    if (!subscription?.id) return;
    setSaving(true);
    try {
      const updated = await subscriptionsService.assignOwner(subscription.id, {
        accountOwnerId,
        followUpFrequencyMonths: followUpFrequencyMonths ? Number(followUpFrequencyMonths) : undefined,
      });
      toast.success("Owner assigned and follow-up created");
      onSuccess(updated);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to assign owner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Owner</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Subscription: <span className="font-mono">{subscription?.subscriptionNumber}</span>
          </div>

          <Select value={accountOwnerId} onValueChange={setAccountOwnerId} disabled={loadingUsers}>
            <SelectTrigger>
              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select owner"} />
            </SelectTrigger>
            <SelectContent>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Follow-up frequency months (optional)"
            value={followUpFrequencyMonths}
            onChange={(e) => setFollowUpFrequencyMonths(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Saving..." : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}