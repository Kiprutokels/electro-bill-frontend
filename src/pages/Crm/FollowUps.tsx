import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  CheckCircle,
  Filter,
  AlertTriangle,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { useCrmFollowUps } from "@/hooks/useCrmFollowUps";
import { formatDate } from "@/utils/format.utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import FollowUpCompleteDialog from "@/components/crm/FollowUpCompleteDialog";
import CreateFollowUpDialog from "@/components/crm/CreateFollowUpDialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

function dueBadge(dueDate: string, status: string) {
  if (status === "COMPLETED") return <Badge variant="outline">COMPLETED</Badge>;
  const d = new Date(dueDate);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (d < start)
    return <Badge className="bg-red-500 text-white">OVERDUE</Badge>;
  if (d >= start && d <= end)
    return <Badge className="bg-green-500 text-white">TODAY</Badge>;
  const diffDays = Math.ceil(
    (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 7)
    return <Badge className="bg-yellow-500 text-white">IN {diffDays}d</Badge>;
  return <Badge variant="outline">IN {diffDays}d</Badge>;
}

export default function CrmFollowUps() {
  const { user } = useAuth();
  const [sp] = useSearchParams();

  const subscriptionIdFromUrl = sp.get("subscriptionId") || "";

  const [search, setSearch] = useState("");
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [assignedToMe, setAssignedToMe] = useState(true);
  const [status, setStatus] = useState<string>("PENDING");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const queryParams = useMemo(() => {
    const q: any = { page: 1, limit: 50, search };

    if (subscriptionIdFromUrl) q.subscriptionId = subscriptionIdFromUrl;
    if (assignedToMe && user?.id) q.assignedTo = user.id;
    if (status && status !== "ALL") q.status = status;
    if (overdueOnly) q.overdue = true;

    return q;
  }, [
    search,
    subscriptionIdFromUrl,
    assignedToMe,
    user?.id,
    status,
    overdueOnly,
  ]);

  const { list, complete, create } = useCrmFollowUps(queryParams);

  const tasks = list.data?.data ?? [];

  const stats = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const dueToday = tasks.filter(
      (t: any) =>
        t.status !== "COMPLETED" &&
        new Date(t.dueDate) >= start &&
        new Date(t.dueDate) <= end,
    ).length;
    const overdue = tasks.filter(
      (t: any) => t.status !== "COMPLETED" && new Date(t.dueDate) < start,
    ).length;
    const upcoming7 = tasks.filter((t: any) => {
      if (t.status === "COMPLETED") return false;
      const d = new Date(t.dueDate);
      const now = new Date();
      const end7 = new Date();
      end7.setDate(end7.getDate() + 7);
      return d >= now && d <= end7;
    }).length;

    return { dueToday, overdue, upcoming7 };
  }, [tasks]);

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Follow-ups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Queue-driven workflow (complete = logs interaction + schedules next)
          </p>
          {subscriptionIdFromUrl && (
            <p className="text-xs text-muted-foreground mt-1">
              Filtered by subscriptionId:{" "}
              <span className="font-mono">{subscriptionIdFromUrl}</span>
            </p>
          )}
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Follow-up
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Due Today
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueToday}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Upcoming (7d)
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming7}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Follow-up Tasks</CardTitle>
            <Input
              className="sm:w-72"
              placeholder="Search task/customer/subscription..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Filters:</span>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={assignedToMe}
                onCheckedChange={(v) => setAssignedToMe(!!v)}
              />
              Assigned to me
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={overdueOnly}
                onCheckedChange={(v) => setOverdueOnly(!!v)}
              />
              Overdue only
            </label>

            <div className="sm:w-48">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                  <SelectItem value="RESCHEDULED">RESCHEDULED</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Task</TableHead>
                    <TableHead className="min-w-[140px]">
                      Subscription
                    </TableHead>
                    <TableHead className="min-w-[220px]">Customer</TableHead>
                    <TableHead className="min-w-[120px]">Due</TableHead>
                    <TableHead className="min-w-[120px]">Badge</TableHead>
                    <TableHead className="min-w-[140px]">Assigned To</TableHead>
                    <TableHead className="min-w-[120px]">Created By</TableHead>
                    <TableHead className="text-right min-w-[120px]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No follow-ups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.title}</div>
                          {t.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {t.description}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-sm">
                          {t.subscription?.subscriptionNumber ?? "—"}
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {t.customer?.businessName ||
                              t.customer?.contactPerson ||
                              "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.customer?.phone || "—"}
                          </div>
                        </TableCell>

                        <TableCell>{formatDate(t.dueDate)}</TableCell>
                        <TableCell>{dueBadge(t.dueDate, t.status)}</TableCell>

                        <TableCell className="text-sm">
                          {t.assignedUser
                            ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}`
                            : "—"}
                        </TableCell>

                        <TableCell className="text-sm">
                          {t.creator
                            ? `${t.creator.firstName} ${t.creator.lastName}`
                            : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={t.status === "COMPLETED"}
                            onClick={() => setCompleteTaskId(t.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
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

      <CreateFollowUpDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        subscriptionIdPreset={subscriptionIdFromUrl || undefined}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Follow-up created");
            setCreateOpen(false);
          } catch (e: any) {
            toast.error(
              e?.response?.data?.message || "Failed to create follow-up",
            );
          }
        }}
        loading={create.isPending}
      />

      <FollowUpCompleteDialog
        open={!!completeTaskId}
        onOpenChange={(v) => !v && setCompleteTaskId(null)}
        onSubmit={async (payload) => {
          if (!completeTaskId) return;
          try {
            await complete.mutateAsync({ id: completeTaskId, data: payload });
            toast.success(
              "Follow-up completed (interaction logged + next scheduled)",
            );
            setCompleteTaskId(null);
          } catch (e: any) {
            toast.error(
              e?.response?.data?.message || "Failed to complete follow-up",
            );
          }
        }}
        loading={complete.isPending}
      />
    </div>
  );
}
