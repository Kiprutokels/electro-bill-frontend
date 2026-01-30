import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "sonner";

const UpdateTicketStatusCard = ({ ticket }: { ticket: any }) => {
  const { updateStatus } = useTickets();
  const [status, setStatus] = useState(ticket.status);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [escalationReason, setEscalationReason] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="NEW/ASSIGNED/IN_PROGRESS/..." />
        <Input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Resolution notes (required for RESOLVED/CLOSED)" />
        <Input value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="Escalation reason (required for ESCALATED)" />
        <Button
          disabled={updateStatus.isPending}
          onClick={async () => {
            try {
              await updateStatus.mutateAsync({
                id: ticket.id,
                data: { status, resolutionNotes, escalationReason },
              });
              toast.success("Ticket updated");
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
