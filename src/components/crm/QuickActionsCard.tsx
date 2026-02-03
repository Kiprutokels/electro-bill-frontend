import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, PhoneCall, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { toast } from "sonner";
import SmartCreateFollowUpDialog from "@/components/crm/SmartCreateFollowUpDialog";
import SmartInteractionDialog from "@/components/crm/SmartInteractionDialog";
import SmartCreateTicketDialog from "@/components/crm/SmartCreateTicketDialog";

export default function QuickActionsCard({ customerId }: { customerId: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await subscriptionsService.getByCustomer(customerId);
        setSubs(data ?? []);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load customer subscriptions");
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        <Button variant="outline" onClick={() => setFollowUpOpen(true)} disabled={loading || subs.length === 0}>
          <ClipboardList className="h-4 w-4 mr-2" />
          Schedule Follow-up
        </Button>
        <Button variant="outline" onClick={() => setInteractionOpen(true)} disabled={loading || subs.length === 0}>
          <PhoneCall className="h-4 w-4 mr-2" />
          Log Interaction
        </Button>
        <Button variant="outline" onClick={() => setTicketOpen(true)} disabled={loading}>
          <Ticket className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>

        <SmartCreateFollowUpDialog
          open={followUpOpen}
          onOpenChange={setFollowUpOpen}
          customerId={customerId}
          subscriptions={subs}
        />

        <SmartInteractionDialog
          open={interactionOpen}
          onOpenChange={setInteractionOpen}
          customerId={customerId}
          subscriptions={subs}
        />

        <SmartCreateTicketDialog
          open={ticketOpen}
          onOpenChange={setTicketOpen}
          customerId={customerId}
          subscriptions={subs}
        />
      </CardContent>
    </Card>
  );
}
