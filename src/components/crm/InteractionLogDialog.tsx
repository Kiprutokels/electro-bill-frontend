import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { subscriptionsService } from "@/api/services/subscriptions.service";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: any) => Promise<void>;
  loading?: boolean;
  subscriptionIdPreset?: string;
};

export default function InteractionLogDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  subscriptionIdPreset,
}: Props) {
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    subscriptionIdPreset || "",
  );

  const [interactionType, setInteractionType] = useState("CALL");
  const [channel, setChannel] = useState("PHONE");
  const [outcome, setOutcome] = useState("SUCCESSFUL");
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");

  const subsQuery = useQuery({
    queryKey: ["subs-search-for-interaction", subscriptionSearch],
    queryFn: () => subscriptionsService.getAll(1, 25, subscriptionSearch),
    enabled: open && !subscriptionIdPreset,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["subscription-for-interaction", selectedSubscriptionId],
    queryFn: () => subscriptionsService.getById(selectedSubscriptionId),
    enabled: open && !!selectedSubscriptionId,
  });

  const subscription: any = subscriptionQuery.data;
  const customerId = subscription?.customerId || "";

  useEffect(() => {
    if (!open) return;
    setSelectedSubscriptionId(subscriptionIdPreset || "");
    setInteractionType("CALL");
    setChannel("PHONE");
    setOutcome("SUCCESSFUL");
    setNotes("");
    setDurationMinutes("");
  }, [open, subscriptionIdPreset]);

  const canSubmit =
    !!selectedSubscriptionId && !!customerId && notes.trim().length >= 2;

  const submit = async () => {
    await onSubmit({
      subscriptionId: selectedSubscriptionId,
      customerId,
      interactionType,
      channel,
      outcome,
      notes,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!subscriptionIdPreset && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Find Subscription</div>
              <Input
                placeholder="Search subscription/customer/product..."
                value={subscriptionSearch}
                onChange={(e) => setSubscriptionSearch(e.target.value)}
              />
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {subsQuery.isLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : (
                  (subsQuery.data?.data || []).map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`w-full text-left p-3 hover:bg-accent/50 border-b last:border-b-0 ${
                        selectedSubscriptionId === s.id ? "bg-accent/30" : ""
                      }`}
                      onClick={() => setSelectedSubscriptionId(s.id)}
                    >
                      <div className="font-mono text-sm font-semibold">
                        {s.subscriptionNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.customer?.businessName || s.customer?.contactPerson}{" "}
                        • {s.product?.name}
                      </div>
                    </button>
                  ))
                )}
                {!subsQuery.isLoading &&
                  (subsQuery.data?.data || []).length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      No results
                    </div>
                  )}
              </div>
            </div>
          )}

          {!!selectedSubscriptionId && (
            <div className="p-3 rounded-md border bg-muted/30">
              <div className="text-xs text-muted-foreground">
                Selected subscription
              </div>
              <div className="font-mono font-semibold">
                {subscription?.subscriptionNumber || selectedSubscriptionId}
              </div>
              <div className="text-xs text-muted-foreground">
                {subscription?.customer?.businessName ||
                  subscription?.customer?.contactPerson ||
                  "—"}{" "}
                • {subscription?.product?.name || "—"}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Type</div>
              <Select
                value={interactionType}
                onValueChange={setInteractionType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">CALL</SelectItem>
                  <SelectItem value="EMAIL">EMAIL</SelectItem>
                  <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                  <SelectItem value="MEETING">MEETING</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="SITE_VISIT">SITE_VISIT</SelectItem>
                  <SelectItem value="VIDEO_CALL">VIDEO_CALL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Channel</div>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">PHONE</SelectItem>
                  <SelectItem value="EMAIL">EMAIL</SelectItem>
                  <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                  <SelectItem value="IN_PERSON">IN_PERSON</SelectItem>
                  <SelectItem value="ZOOM">ZOOM</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Outcome</div>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESSFUL">SUCCESSFUL</SelectItem>
                  <SelectItem value="NO_RESPONSE">NO_RESPONSE</SelectItem>
                  <SelectItem value="FOLLOW_UP_REQUIRED">
                    FOLLOW_UP_REQUIRED
                  </SelectItem>
                  <SelectItem value="ESCALATED">ESCALATED</SelectItem>
                  <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                  <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Duration (minutes)</div>
              <Input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Notes (required)</div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write the interaction summary..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!!loading || !canSubmit} onClick={submit}>
              {loading ? "Saving..." : "Save Interaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
