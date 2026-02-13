import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    COMPLETED: <CheckCircle className="h-5 w-5 text-green-600" />,
    CANCELLED: <XCircle className="h-5 w-5 text-red-600" />,
    IN_PROGRESS: <Clock className="h-5 w-5 text-purple-600" />,
  };
  return icons[status] || <Clock className="h-5 w-5 text-blue-600" />;
};

const TimelineTab = ({ timeline }: { timeline: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline?.map((update: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-4"
            >
              <div className="flex-shrink-0 mt-1">{getStatusIcon(update.status)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium">{update.message}</p>
                  <Badge variant="outline">{update.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  By {update.user?.firstName} {update.user?.lastName} •{" "}
                  {update.createdAt ? new Date(update.createdAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>
          ))}
          {!timeline?.length && (
            <div className="text-sm text-muted-foreground text-center py-10">
              No timeline updates
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineTab;