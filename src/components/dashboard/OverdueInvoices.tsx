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
import { OverdueInvoiceData } from "@/api/types/dashboard.types";
import { formatCurrency, formatDate } from "@/utils/format.utils";
import { AlertTriangle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OverdueInvoicesProps {
  overdueData: OverdueInvoiceData;
}

export const OverdueInvoices = ({ overdueData }: OverdueInvoicesProps) => {
  const navigate = useNavigate();

  const getDaysPastDueBadge = (days: number) => {
    if (days <= 7) {
      return <Badge variant="destructive" className="bg-yellow-500">Recently Due</Badge>;
    } else if (days <= 30) {
      return <Badge variant="destructive" className="bg-orange-500">Overdue</Badge>;
    } else {
      return <Badge variant="destructive">Severely Overdue</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle>Overdue Invoices</CardTitle>
          <Badge variant="destructive" className="ml-2">
            {overdueData.count}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Amount</div>
          <div className="text-lg font-bold text-red-500">
            {formatCurrency(overdueData.totalAmount)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {overdueData.count === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">
              No overdue invoices. Great job! 🎉
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueData.invoices.slice(0, 10).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: {formatCurrency(invoice.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={invoice.customer}>
                        {invoice.customer}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-red-500">
                        {formatCurrency(invoice.outstandingAmount)}
                      </div>
                      {invoice.amountPaid > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Paid: {formatCurrency(invoice.amountPaid)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {formatDate(invoice.dueDate.toString())}
                    </TableCell>
                    <TableCell>
                      {getDaysPastDueBadge(invoice.daysPastDue)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {invoice.daysPastDue} days overdue
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
