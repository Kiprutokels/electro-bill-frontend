import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecentActivity } from "@/api/types/dashboard.types";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { FileText, CreditCard, FileBarChart } from "lucide-react";

interface RecentActivitiesProps {
  activities: {
    recentInvoices: RecentActivity[];
    recentPayments: RecentActivity[];
    recentQuotations: RecentActivity[];
  };
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => {

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'quotation':
        return <FileBarChart className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (type: string, status?: string) => {
    if (!status) return null;

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
        case 'completed':
          return 'bg-green-500';
        case 'pending':
        case 'sent':
          return 'bg-yellow-500';
        case 'overdue':
        case 'cancelled':
          return 'bg-red-500';
        case 'partial':
          return 'bg-orange-500';
        default:
          return 'bg-gray-500';
      }
    };

    return (
      <Badge variant="secondary" className={`${getStatusColor(status)} text-white`}>
        {status}
      </Badge>
    );
  };

  const allActivities = [
    ...activities.recentInvoices,
    ...activities.recentPayments,
    ...activities.recentQuotations,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activities</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Type</TableHead>
                <TableHead className="min-w-[120px]">Number</TableHead>
                <TableHead className="min-w-[150px]">Customer</TableHead>
                <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                <TableHead className="hidden md:table-cell min-w-[100px]">Status</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[100px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No recent activities found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                allActivities.map((activity, index) => (
                  <TableRow key={`${activity.type}-${activity.id}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span className="capitalize text-sm">
                          {activity.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {activity.number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={activity.customer}>
                        {activity.customer}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(activity.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {activity.status && getStatusBadge(activity.type, activity.status)}
                      {activity.method && (
                        <Badge variant="outline" className="text-xs">
                          {activity.method}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(activity.date.toString())}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
