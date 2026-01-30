import { useState } from "react";
import { useTickets } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import CreateTicketDialog from "@/components/tickets/CreateTicketDialog";

const Tickets = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { list, create } = useTickets({ page: 1, limit: 50, search });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tickets = list.data?.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured issue tracking with SLA + reassignment logs
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>All Tickets</CardTitle>
          <Input
            className="sm:w-72"
            placeholder="Search ticket #, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">{t.ticketNumber}</TableCell>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell>{t.priority}</TableCell>
                        <TableCell>{t.customer?.businessName || t.customer?.contactPerson || "—"}</TableCell>
                        <TableCell className={t.slaBreached ? "text-red-600 font-semibold" : ""}>
                          {t.slaBreached ? "BREACHED" : (t.slaDeadline ? new Date(t.slaDeadline).toLocaleString() : "—")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/tickets/${t.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        loading={create.isPending}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Ticket created");
            setCreateOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to create ticket");
          }
        }}
      />
    </div>
  );
};

export default Tickets;
