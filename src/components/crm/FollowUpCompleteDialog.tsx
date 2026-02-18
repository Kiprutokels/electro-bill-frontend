import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function FollowUpCompleteDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: any) => Promise<void>;
  loading?: boolean;
}) {
  const [interactionType, setInteractionType] = useState("CALL");
  const [channel, setChannel] = useState("PHONE");
  const [outcome, setOutcome] = useState("SUCCESSFUL");
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [nextOverrideEnabled, setNextOverrideEnabled] = useState(false);
  const [nextFollowUpLocal, setNextFollowUpLocal] = useState(
    toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );

  useEffect(() => {
    if (!open) return;
    setInteractionType("CALL");
    setChannel("PHONE");
    setOutcome("SUCCESSFUL");
    setNotes("");
    setDurationMinutes("");
    setNextOverrideEnabled(false);
    setNextFollowUpLocal(
      toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    );
  }, [open]);

  const payload = {
    interactionType,
    channel,
    outcome,
    notes,
    durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
    nextFollowUpDateOverride: nextOverrideEnabled
      ? new Date(nextFollowUpLocal).toISOString()
      : "",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Complete Follow-up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Interaction Type</div>
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
              <div className="text-sm font-medium mb-1">
                Duration (minutes, optional)
              </div>
              <Input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Notes (required)</div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? What did the customer say? Next step?"
            />
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Next follow-up scheduling</div>
            <div className="text-xs text-muted-foreground mt-1">
              If you don’t override, the system will auto-calculate based on CRM
              frequency.
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={nextOverrideEnabled}
                onChange={(e) => setNextOverrideEnabled(e.target.checked)}
              />
              <span className="text-sm">Override next follow-up date/time</span>
            </div>

            {nextOverrideEnabled && (
              <div className="mt-3">
                <Input
                  type="datetime-local"
                  value={nextFollowUpLocal}
                  onChange={(e) => setNextFollowUpLocal(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!!loading || notes.trim().length < 2}
              onClick={() => onSubmit(payload)}
            >
              {loading ? "Completing..." : "Complete & Log Interaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
