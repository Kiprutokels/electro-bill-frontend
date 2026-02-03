import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ticketsService } from "@/api/services/tickets.service";

const CATEGORIES = ["TECHNICAL", "BILLING", "SUPPORT", "TRAINING", "OTHER"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

export default function SmartCreateTicketDialog({
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
  const [subscriptionId, setSubscriptionId] = useState<string>("none");
  const [category, setCategory] = useState<string>("SUPPORT");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => subject.trim() && description.trim() && category && priority, [subject, description, category, priority]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubscriptionId("none");
      setCategory("SUPPORT");
      setPriority("NORMAL");
      setSubject("");
      setDescription("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await ticketsService.create({
        customerId,
        subscriptionId: subscriptionId !== "none" ? subscriptionId : undefined,
        category,
        priority,
        subject,
        description,
      });
      toast.success("Ticket created successfully");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link Subscription (optional)</label>
            <Select value={subscriptionId} onValueChange={setSubscriptionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subscription</SelectItem>
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

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority *</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((pri) => (
                  <SelectItem key={pri} value={pri}>
                    {pri}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject *</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue"
              className="min-h-[100px] resize-none"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Creating..." : "Create Ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}