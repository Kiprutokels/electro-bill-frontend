import { useMemo, useState } from "react";
import { useTickets } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Eye,
  List,
  User,
  Building2,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateTicketDialog from "@/components/tickets/CreateTicketDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Scope = "all" | "my" | "department";

const STATUSES = [
  "ALL",
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
] as const;

const Tickets = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const navigate = useNavigate();

  const params = useMemo(() => {
    const p: any = { page: 1, limit: 50, search, scope };
    if (status !== "ALL") p.status = status;
    return p;
  }, [search, scope, status]);

  const { list, create } = useTickets(params);

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tickets = list.data?.data ?? [];
  const meta = list.data?.meta;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            My tickets + Primary department tickets (admin can view all)
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Scope & Filters */}
      <Card>
        <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={scope === "all" ? "default" : "outline"}
              onClick={() => setScope("all")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              All Tickets
            </Button>
            <Button
              variant={scope === "my" ? "default" : "outline"}
              onClick={() => setScope("my")}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              My Tickets
            </Button>
            <Button
              variant={scope === "department" ? "default" : "outline"}
              onClick={() => setScope("department")}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Department Tickets
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
            <div className="w-full sm:w-56">
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 opacity-60" />
                  <SelectValue placeholder="Filter by status" />
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

            <Input
              className="sm:w-72"
              placeholder="Search ticket #, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Ticket List</CardTitle>
          <div className="text-xs text-muted-foreground">
            {meta?.isAdmin ? (
              <span className="text-muted-foreground">
                Admin mode enabled (role/permission)
              </span>
            ) : (
              <span className="text-muted-foreground">
                User mode: limited to My + Primary Department
              </span>
            )}
            {meta?.effectiveMode ? (
              <span className="ml-2">
                Effective: <span className="font-medium text-foreground">{meta.effectiveMode}</span>
              </span>
            ) : null}
          </div>
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
                    <TableHead>Assigned</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">
                          {t.ticketNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.subject}
                        </TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell>{t.priority}</TableCell>

                        <TableCell className="text-xs">
                          <div className="space-y-1">
                            <div>
                              <span className="text-muted-foreground">
                                User:
                              </span>{" "}
                              {t.assignedUser
                                ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}`
                                : "—"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Dept:
                              </span>{" "}
                              {t.assignedDept ? t.assignedDept.name : "—"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {t.customer?.businessName ||
                            t.customer?.contactPerson ||
                            "—"}
                        </TableCell>

                        <TableCell
                          className={t.slaBreached ? "text-red-600 font-semibold" : ""}
                        >
                          {t.slaBreached
                            ? "BREACHED"
                            : t.slaDeadline
                              ? new Date(t.slaDeadline).toLocaleString()
                              : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tickets/${t.id}`)}
                          >
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