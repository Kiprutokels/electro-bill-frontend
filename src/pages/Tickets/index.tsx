import { useMemo, useState } from "react";
import { useTickets } from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/api/services/users.service";
import { departmentsService } from "@/api/services/departments.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Eye,
  List,
  User,
  Building2,
  Filter,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CreateTicketDialog from "@/components/tickets/CreateTicketDialog";

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

const statusVariant = (s: string) => {
  const v = s?.toUpperCase();
  if (v === "CLOSED") return "secondary";
  if (v === "RESOLVED") return "default";
  if (v === "ESCALATED") return "destructive";
  return "outline";
};

const priorityVariant = (p: string) => {
  const v = p?.toUpperCase();
  if (v === "CRITICAL") return "destructive";
  if (v === "HIGH") return "default";
  return "outline";
};

// ─── Quick Assign Modal ───────────────────────────────────────────────────────
interface QuickAssignModalProps {
  ticket: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const QuickAssignModal = ({
  ticket,
  open,
  onOpenChange,
}: QuickAssignModalProps) => {
  const { assign } = useTickets();
  const [assignedTo, setAssignedTo] = useState<string>(
    ticket?.assignedTo ?? "__none__",
  );
  const [assignedDeptId, setAssignedDeptId] = useState<string>(
    ticket?.assignedDeptId ?? "__none__",
  );
  const [reason, setReason] = useState("");

  const users = useQuery({
    queryKey: ["users-for-assign"],
    queryFn: () => usersService.getUsers({ page: 1, limit: 200 }),
    enabled: open,
  });

  const departments = useQuery({
    queryKey: ["departments", false],
    queryFn: () => departmentsService.getAll(false),
    enabled: open,
  });

  const userRows: any[] = users.data?.data ?? [];
  const deptRows: any[] = departments.data ?? [];

  const effectiveUser = assignedTo === "__none__" ? undefined : assignedTo;
  const effectiveDept =
    assignedDeptId === "__none__" ? undefined : assignedDeptId;

  const handleSubmit = async () => {
    if (!effectiveUser && !effectiveDept) {
      toast.error("Select at least a user or department");
      return;
    }
    try {
      await assign.mutateAsync({
        id: ticket.id,
        data: {
          assignedTo: effectiveUser,
          assignedDeptId: effectiveDept,
          reason: reason || undefined,
        },
      });
      toast.success(`Ticket ${ticket.ticketNumber} assigned`);
      onOpenChange(false);
      setReason("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to assign ticket");
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assign — {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Subject reminder */}
          <div className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2 truncate">
            {ticket.subject}
          </div>

          {/* Current assignment */}
          {(ticket.assignedUser || ticket.assignedDept) && (
            <div className="text-xs bg-muted/60 rounded-md px-3 py-2 space-y-0.5">
              <div className="font-medium text-foreground">
                Currently assigned
              </div>
              {ticket.assignedUser && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {ticket.assignedUser.firstName} {ticket.assignedUser.lastName}
                </div>
              )}
              {ticket.assignedDept && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {ticket.assignedDept.name}
                </div>
              )}
            </div>
          )}

          {/* Assign to User */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Assign to User</div>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Unassign —</SelectItem>
                {userRows.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({u.email})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign to Dept */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Assign to Department
            </div>
            <Select value={assignedDeptId} onValueChange={setAssignedDeptId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Unassign —</SelectItem>
                {deptRows.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({d.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Reason (optional)
            </div>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Routing to billing team..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={assign.isPending || (!effectiveUser && !effectiveDept)}
              onClick={handleSubmit}
            >
              {assign.isPending ? "Assigning..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Tickets page ────────────────────────────────────────────────────────
const Tickets = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const isAdmin = user?.role === "ADMIN" || hasPermission("tickets.read_all");
  const canAssign = user?.role === "ADMIN" || hasPermission("tickets.assign");

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");

  // Quick assign state
  const [assignTarget, setAssignTarget] = useState<any | null>(null);

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

  const tickets: any[] = list.data?.data ?? [];
  const meta = list.data?.meta;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Admin: full visibility + assignment"
              : "My tickets + primary department tickets"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Scope tabs + filters */}
      <Card>
        <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={scope === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("all")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              All
            </Button>
            <Button
              variant={scope === "my" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("my")}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              My Tickets
            </Button>
            <Button
              variant={scope === "department" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("department")}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Department
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="sm:w-48">
                <Filter className="h-4 w-4 mr-2 opacity-60" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              className="sm:w-64"
              placeholder="Search ticket #, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base">
            Ticket List
            {meta?.total !== undefined && (
              <span className="text-xs text-muted-foreground font-normal ml-2">
                ({meta.total} total)
              </span>
            )}
          </CardTitle>
          {meta && (
            <span className="text-xs text-muted-foreground">
              {isAdmin ? "Admin mode" : `Scope: ${meta.effectiveMode ?? scope}`}
            </span>
          )}
        </CardHeader>

        <CardContent className="p-0 sm:px-4 sm:pb-4">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">
                          {t.ticketNumber}
                        </TableCell>

                        <TableCell className="font-medium max-w-[180px]">
                          <span className="truncate block">{t.subject}</span>
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant(t.status) as any}>
                            {t.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={priorityVariant(t.priority) as any}>
                            {t.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {t.assignedUser
                                ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}`
                                : "—"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {t.assignedDept ? t.assignedDept.name : "—"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          {t.customer?.businessName ||
                            t.customer?.contactPerson ||
                            "—"}
                        </TableCell>

                        <TableCell>
                          {t.slaBreached ? (
                            <span className="text-destructive text-xs font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              BREACHED
                            </span>
                          ) : t.slaDeadline ? (
                            <span className="text-xs">
                              {new Date(t.slaDeadline).toLocaleDateString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Quick assign — admin only */}
                            {canAssign && (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Quick assign"
                                onClick={() => setAssignTarget(t)}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/tickets/${t.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
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

      {/* Create dialog */}
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
            toast.error(
              e?.response?.data?.message || "Failed to create ticket",
            );
          }
        }}
      />

      {/* Quick assign modal */}
      <QuickAssignModal
        ticket={assignTarget}
        open={!!assignTarget}
        onOpenChange={(v) => !v && setAssignTarget(null)}
      />
    </div>
  );
};

export default Tickets;
