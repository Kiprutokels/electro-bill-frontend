import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getCheckStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CHECKED: "bg-green-500",
    NOT_CHECKED: "bg-gray-500",
    ISSUE_FOUND: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const PreInspectionTab = ({ checklist }: { checklist: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Installation Checklist</CardTitle>
      </CardHeader>

      <CardContent>
        {!checklist?.length ? (
          <p className="text-center text-muted-foreground py-8">No pre-inspection data</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklist.map((check: any, idx: number) => (
                  <TableRow key={check.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{check.checklistItem?.name}</TableCell>
                    <TableCell>
                      <Badge className={getCheckStatusColor(check.status)}>
                        {check.status === "CHECKED" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : check.status === "ISSUE_FOUND" ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {check.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {check.technician?.user?.firstName} {check.technician?.user?.lastName}
                    </TableCell>
                    <TableCell>{check.checkedAt ? new Date(check.checkedAt).toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{check.notes || "-"}</TableCell>
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

export default PreInspectionTab;