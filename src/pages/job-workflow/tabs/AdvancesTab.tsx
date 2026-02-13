import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AdvanceRequestStatus } from "@/api/services/advance-requests.service";

const getAdvanceStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    APPROVED: "bg-blue-500",
    DISBURSED: "bg-green-500",
    REJECTED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

type Props = {
  loading: boolean;
  advances: any[];
  onView: (adv: any) => void;
  onApprove: (id: string) => void;
  onReject: (adv: any) => void;
  onDisburse: (adv: any) => void;
  approving: boolean;
};

const AdvancesTab = ({
  loading,
  advances,
  onView,
  onApprove,
  onReject,
  onDisburse,
  approving,
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Advances (This Job)</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : advances.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No advance requests for this job
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {advances.map((req: any) => (
                <Card key={req.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-medium">
                          {req.requestNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(req.requestedDate).toLocaleString()}
                        </div>
                      </div>

                      <Badge className={getAdvanceStatusColor(req.status)}>
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {req.requestType.replace(/_/g, " ")}
                      </div>
                      <div className="font-bold text-primary">
                        KES{" "}
                        {parseFloat(String(req.amount)).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(req)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>

                      {req.status === AdvanceRequestStatus.PENDING && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onApprove(req.id)}
                            disabled={approving}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(req)}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {req.status === AdvanceRequestStatus.APPROVED && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onDisburse(req)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Disburse
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {advances.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-medium">
                        {req.requestNumber}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {req.requestType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-bold text-primary">
                        KES{" "}
                        {parseFloat(String(req.amount)).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-sm">
                        {new Date(req.requestedDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <Badge className={getAdvanceStatusColor(req.status)}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onView(req)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {req.status === AdvanceRequestStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onApprove(req.id)}
                                disabled={approving}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onReject(req)}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {req.status === AdvanceRequestStatus.APPROVED && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onDisburse(req)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Disburse
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancesTab;
