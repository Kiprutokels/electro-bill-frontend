import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { crmInteractionsService } from "@/api/services/crm-interactions.service";

const INTERACTION_TYPES = ["CALL", "EMAIL", "SMS", "CHAT", "IN_PERSON", "VIDEO_CALL"];
const CHANNELS = ["PHONE", "EMAIL", "WHATSAPP", "SMS", "CHAT", "IN_PERSON", "VIDEO"];
const OUTCOMES = ["SUCCESSFUL", "NO_RESPONSE", "FOLLOW_UP_REQUIRED", "ESCALATED", "RESOLVED", "SCHEDULED"];

export default function SmartInteractionDialog({
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
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [interactionType, setInteractionType] = useState("CALL");
  const [channel, setChannel] = useState("PHONE");
  const [outcome, setOutcome] = useState("SUCCESSFUL");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => !!subscriptionId && notes.trim().length > 2 && interactionType && channel && outcome, [subscriptionId, notes, interactionType, channel, outcome]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubscriptionId("");
      setInteractionType("CALL");
      setChannel("PHONE");
      setOutcome("SUCCESSFUL");
      setNotes("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await crmInteractionsService.create({
        subscriptionId,
        customerId,
        interactionType,
        channel,
        notes,
        outcome,
      });
      toast.success("Interaction logged successfully");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to log interaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscription *</label>
            <Select value={subscriptionId} onValueChange={setSubscriptionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subscription" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.length > 0 ? (
                  subscriptions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.subscriptionNumber} • {s.product?.name ?? "Product"} • {s.status}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No subscriptions available</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Interaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Interaction Type *</label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select interaction type" />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel *</label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {ch.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcome *</label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((out) => (
                  <SelectItem key={out} value={out}>
                    {out.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes *</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the interaction details and any important information"
              className="min-h-[100px] resize-none"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">{notes.length} characters</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Logging..." : "Log Interaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}