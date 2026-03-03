import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ticketsService } from "@/api/services/tickets.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserCheck,
  Building2,
  User,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import AddTicketComment from "@/components/tickets/AddTicketComment";
import UpdateTicketStatusCard from "@/components/tickets/UpdateTicketStatusCard";
import AssignTicketCard from "@/components/tickets/AssignTicketCard";
import { useAuth } from "@/contexts/AuthContext";

const statusVariant = (status: string) => {
  const s = status?.toUpperCase();
  if (s === "CLOSED") return "secondary";
  if (s === "RESOLVED") return "default";
  if (s === "ESCALATED") return "destructive";
  return "outline";
};

const priorityVariant = (priority: string) => {
  const p = priority?.toUpperCase();
  if (p === "CRITICAL") return "destructive";
  if (p === "HIGH") return "default";
  return "outline";
};

const TicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const isAdmin = user?.role === "ADMIN" || hasPermission("tickets.read_all");
  const canAssign = user?.role === "ADMIN" || hasPermission("tickets.assign");

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

  if (q.isError || !q.data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">
          Ticket not found or access denied.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const t = q.data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Back button + header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono">
                {t.ticketNumber}
              </h1>
              <Badge variant={statusVariant(t.status) as any}>{t.status}</Badge>
              <Badge variant={priorityVariant(t.priority) as any}>
                {t.priority}
              </Badge>
              {t.slaBreached && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  SLA BREACHED
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-base">{t.subject}</p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      Category
                    </span>
                    <span className="font-medium">{t.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      Customer
                    </span>
                    <span className="font-medium">
                      {t.customer?.businessName ||
                        t.customer?.contactPerson ||
                        "—"}
                    </span>
                    {t.customer?.phone && (
                      <div className="text-xs text-muted-foreground">
                        {t.customer.phone}
                      </div>
                    )}
                  </div>
                  {t.subscription && (
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">
                        Subscription
                      </span>
                      <span className="font-medium">
                        {t.subscription.subscriptionNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      Created by
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {t.creator?.firstName} {t.creator?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      Assigned User
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      {t.assignedUser
                        ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}`
                        : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      Assigned Dept
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {t.assignedDept
                        ? `${t.assignedDept.name} (${t.assignedDept.code})`
                        : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">
                      SLA Deadline
                    </span>
                    <span
                      className={`font-medium flex items-center gap-1 ${
                        t.slaBreached ? "text-red-600" : ""
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {t.slaBreached
                        ? "BREACHED"
                        : t.slaDeadline
                          ? new Date(t.slaDeadline).toLocaleString()
                          : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-muted-foreground block text-xs mb-1">
                  Description
                </span>
                <div className="text-sm whitespace-pre-wrap bg-muted rounded-md p-3">
                  {t.description}
                </div>
              </div>

              {t.resolutionNotes && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">
                    Resolution Notes
                  </span>
                  <div className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                    {t.resolutionNotes}
                  </div>
                </div>
              )}

              {t.escalationReason && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">
                    Escalation Reason
                  </span>
                  <div className="text-sm whitespace-pre-wrap bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-3">
                    {t.escalationReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reassignment history */}
          {(t.reassignments ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reassignment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {t.reassignments.map((r: any) => (
                  <div
                    key={r.id}
                    className="text-xs border rounded-md p-2 space-y-1"
                  >
                    <div className="text-muted-foreground">
                      {new Date(r.reassignedAt).toLocaleString()} — by{" "}
                      <span className="font-medium text-foreground">
                        {r.reassigner?.firstName} {r.reassigner?.lastName}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(r.fromUser || r.toUser) && (
                        <span>
                          User:{" "}
                          {r.fromUser
                            ? `${r.fromUser.firstName} ${r.fromUser.lastName}`
                            : "—"}{" "}
                          →{" "}
                          {r.toUser
                            ? `${r.toUser.firstName} ${r.toUser.lastName}`
                            : "—"}
                        </span>
                      )}
                      {(r.fromDept || r.toDept) && (
                        <span>
                          Dept: {r.fromDept ? r.fromDept.name : "—"} →{" "}
                          {r.toDept ? r.toDept.name : "—"}
                        </span>
                      )}
                    </div>
                    {r.reason && (
                      <div className="text-muted-foreground italic">
                        "{r.reason}"
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Action cards */}
        <div className="space-y-4">
          <UpdateTicketStatusCard ticket={t} />
          {canAssign && <AssignTicketCard ticket={t} />}
        </div>
      </div>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(t.comments ?? []).length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No comments yet.
            </div>
          )}
          {(t.comments ?? []).map((c: any) => (
            <div key={c.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                <span className="text-xs font-medium">
                  {c.author?.firstName} {c.author?.lastName}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  {c.isInternal && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Internal
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{c.content}</div>
            </div>
          ))}
          <AddTicketComment ticketId={t.id} isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketView;
