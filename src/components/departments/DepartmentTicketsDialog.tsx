import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ticketsService } from "@/api/services/tickets.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusVariant = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s === "CLOSED") return "secondary";
  if (s === "RESOLVED") return "default";
  if (s === "ESCALATED") return "destructive";
  return "outline";
};

const priorityVariant = (priority: string) => {
  const p = (priority || "").toUpperCase();
  if (p === "CRITICAL") return "destructive";
  if (p === "HIGH") return "default";
  return "outline";
};

interface DepartmentTicketsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departmentId: string;
  departmentName: string;
}

const DepartmentTicketsDialog = ({
  open,
  onOpenChange,
  departmentId,
  departmentName,
}: DepartmentTicketsDialogProps) => {
  const navigate = useNavigate();

  const params = useMemo(
    () => ({ page: 1, limit: 100, scope: "all", assignedDeptId: departmentId }),
    [departmentId]
  );

  const q = useQuery({
    queryKey: ["department-tickets", departmentId],
    queryFn: () => ticketsService.list(params),
    enabled: open && !!departmentId,
    retry: 0,
  });

  const tickets: any[] = q.data?.data ?? [];
  const meta = q.data?.meta;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Tickets — {departmentName}
            {meta?.total !== undefined && (
              <span className="text-xs text-muted-foreground font-normal ml-2">
                ({meta.total} total)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {q.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : q.isError ? (
          <div className="py-10 text-center text-sm text-destructive">
            Failed to load tickets. You may not have admin access.
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No tickets assigned to this department.
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden max-h-[65vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">
                      {t.ticketNumber}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {t.subject}
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
                    <TableCell className="text-sm">
                      {t.assignedUser
                        ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}`
                        : "—"}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/tickets/${t.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentTicketsDialog;
