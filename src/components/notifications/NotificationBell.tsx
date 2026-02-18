import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/api/services/notifications.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationsService.getUnread,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to mark all read"),
  });

  const list = data || [];
  const unreadCount = list.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1">
              <Badge className="bg-red-500 text-white px-2 py-0 text-xs">
                {unreadCount}
              </Badge>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 font-semibold">Notifications</div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : unreadCount === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            No unread notifications
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto">
              {list.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/jobs/${n.jobId}/workflow`);
                  }}
                >
                  <div className="text-sm font-medium">
                    {n.subject || "Notification"}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {n.message}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(n.sentAt).toLocaleString()}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />
            <div className="p-2 flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
              >
                View All
              </Button>
              <Button
                className="w-full"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Mark All
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;