import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/api/services/notifications.service";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, CheckCircle2, Mail, Calendar, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationsService.getUnread,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to mark read"),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to mark all read"),
  });

  const list = data || [];

  const iconFor = (type: string) => {
    if (type === "JOB_ASSIGNMENT") return <Briefcase className="h-4 w-4" />;
    if (type === "JOB_REMINDER") return <Calendar className="h-4 w-4" />;
    if (type === "INVOICE_GENERATED") return <Mail className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const badgeFor = (type: string) => {
    const map: Record<string, string> = {
      JOB_ASSIGNMENT: "bg-blue-500",
      JOB_REMINDER: "bg-yellow-500",
      JOB_RESCHEDULED: "bg-orange-500",
      JOB_COMPLETION: "bg-green-600",
      INVOICE_GENERATED: "bg-purple-600",
      CONSENT_REQUIRED: "bg-red-500",
    };
    return map[type] || "bg-gray-500";
  };

  return (

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Unread alerts and workflow updates</p>
          </div>

          <Button
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || list.length === 0}
          >
            {markAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark All Read
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unread Notifications ({list.length})</CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : list.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No unread notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{iconFor(n.notificationType)}</div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${badgeFor(n.notificationType)} text-white`}>
                            {n.notificationType.replace(/_/g, " ")}
                          </Badge>
                          {n.job?.jobNumber && (
                            <Badge variant="outline" className="font-mono">
                              {n.job.jobNumber}
                            </Badge>
                          )}
                        </div>

                        <div className="font-medium">{n.subject || "Notification"}</div>
                        <div className="text-sm text-muted-foreground">{n.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(n.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {n.job?.id && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/jobs/${n.job!.id}/workflow`)}
                        >
                          View Job
                        </Button>
                      )}
                      <Button
                        onClick={() => markReadMutation.mutate(n.id)}
                        disabled={markReadMutation.isPending}
                      >
                        Mark Read
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default NotificationsPage;
