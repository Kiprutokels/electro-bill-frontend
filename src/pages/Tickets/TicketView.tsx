import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ticketsService } from "@/api/services/tickets.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import AddTicketComment from "@/components/tickets/AddTicketComment";
import UpdateTicketStatusCard from "@/components/tickets/UpdateTicketStatusCard";

const TicketView = () => {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketsService.getById(id!),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const t = q.data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t.ticketNumber}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subject}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-muted-foreground">Status:</span> {t.status}</div>
            <div><span className="text-muted-foreground">Priority:</span> {t.priority}</div>
            <div><span className="text-muted-foreground">Category:</span> {t.category}</div>
            <div><span className="text-muted-foreground">Customer:</span> {t.customer?.businessName || t.customer?.contactPerson}</div>
            <div><span className="text-muted-foreground">SLA:</span> {t.slaBreached ? "BREACHED" : (t.slaDeadline ? new Date(t.slaDeadline).toLocaleString() : "—")}</div>

            <div className="pt-3">
              <div className="text-sm font-medium">Description</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</div>
            </div>
          </CardContent>
        </Card>

        <UpdateTicketStatusCard ticket={t} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(t.comments || []).map((c: any) => (
            <div key={c.id} className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">
                {c.author?.firstName} {c.author?.lastName} • {new Date(c.createdAt).toLocaleString()} • {c.isInternal ? "Internal" : "Public"}
              </div>
              <div className="text-sm whitespace-pre-wrap mt-1">{c.content}</div>
            </div>
          ))}
          <AddTicketComment ticketId={t.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketView;
