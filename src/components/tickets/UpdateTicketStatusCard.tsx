import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
] as const;

const UpdateTicketStatusCard = ({ ticket }: { ticket: any }) => {
  const { updateStatus } = useTickets();
  const [status, setStatus] = useState(ticket.status);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [escalationReason, setEscalationReason] = useState("");

  const needsResolution = useMemo(
    () => status === "RESOLVED" || status === "CLOSED",
    [status]
  );
  const needsEscalation = useMemo(() => status === "ESCALATED", [status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Status</div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsResolution && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Resolution notes (required)
            </div>
            <Input
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Explain how it was resolved..."
            />
          </div>
        )}

        {needsEscalation && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Escalation reason (required)
            </div>
            <Input
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Why are you escalating this ticket?"
            />
          </div>
        )}

        <Button
          className="w-full"
          disabled={updateStatus.isPending}
          onClick={async () => {
            try {
              await updateStatus.mutateAsync({
                id: ticket.id,
                data: {
                  status,
                  resolutionNotes: resolutionNotes || undefined,
                  escalationReason: escalationReason || undefined,
                },
              });
              toast.success("Ticket updated");
              setResolutionNotes("");
              setEscalationReason("");
            } catch (e: any) {
              toast.error(e?.response?.data?.message || "Failed to update ticket");
            }
          }}
        >
          {updateStatus.isPending ? "Updating..." : "Update"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpdateTicketStatusCard;