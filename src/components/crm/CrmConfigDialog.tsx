import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscription: any | null;
  loading?: boolean;
  onSubmit: (payload: {
    followUpFrequencyMonths?: number;
    followUpTimesPerYear?: number;
    priority?: "NORMAL" | "HIGH_VALUE" | "CRITICAL";
    crmStatus?: "ACTIVE" | "PAUSED" | "AT_RISK" | "CANCELLED";
    tags?: string[];
  }) => Promise<void>;
};

function parseTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const j = JSON.parse(tags);
      return Array.isArray(j) ? j : [];
    } catch {
      return tags.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

export default function CrmConfigDialog({
  open,
  onOpenChange,
  subscription,
  loading,
  onSubmit,
}: Props) {
  const initialTags = useMemo(() => parseTags(subscription?.tags), [subscription?.tags]);

  const [crmStatus, setCrmStatus] = useState<"ACTIVE" | "PAUSED" | "AT_RISK" | "CANCELLED">("ACTIVE");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH_VALUE" | "CRITICAL">("NORMAL");
  const [followUpFrequencyMonths, setFollowUpFrequencyMonths] = useState<string>("");
  const [followUpTimesPerYear, setFollowUpTimesPerYear] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!subscription) return;
    setCrmStatus(subscription.crmStatus || "ACTIVE");
    setPriority(subscription.priority || "NORMAL");
    setFollowUpFrequencyMonths(subscription.followUpFrequencyMonths?.toString?.() || "");
    setFollowUpTimesPerYear(subscription.followUpTimesPerYear?.toString?.() || "");
    setTags(initialTags);
    setTagInput("");
  }, [subscription, initialTags, open]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const submit = async () => {
    await onSubmit({
      crmStatus,
      priority,
      followUpFrequencyMonths: followUpFrequencyMonths ? Number(followUpFrequencyMonths) : undefined,
      followUpTimesPerYear: followUpTimesPerYear ? Number(followUpTimesPerYear) : undefined,
      tags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>CRM Config</DialogTitle>
        </DialogHeader>

        {!subscription ? (
          <div className="text-sm text-muted-foreground">No subscription selected</div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              {subscription.subscriptionNumber} • {subscription.customer?.businessName || subscription.customer?.contactPerson} • {subscription.product?.name}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">CRM Status</div>
                <Select value={crmStatus} onValueChange={(v: any) => setCrmStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="AT_RISK">AT_RISK</SelectItem>
                    <SelectItem value="PAUSED">PAUSED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Priority</div>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                    <SelectItem value="HIGH_VALUE">HIGH_VALUE</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Follow-up frequency (months)</div>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 3"
                  value={followUpFrequencyMonths}
                  onChange={(e) => setFollowUpFrequencyMonths(e.target.value)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Leave blank to use subscription or system default.
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Follow-ups per year</div>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 4"
                  value={followUpTimesPerYear}
                  onChange={(e) => setFollowUpTimesPerYear(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Tags</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag and press Add (e.g. VIP)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {tags.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No tags</div>
                ) : (
                  tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => removeTag(t)}
                      className="inline-flex"
                      title="Click to remove"
                    >
                      <Badge variant="outline">{t} ✕</Badge>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!!loading} onClick={submit}>
                {loading ? "Saving..." : "Save CRM Config"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}