import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RequisitionStatus } from "@/api/services/requisitions.service";

const getRequisitionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    APPROVED: "bg-blue-500",
    PARTIALLY_ISSUED: "bg-orange-500",
    FULLY_ISSUED: "bg-green-500",
    REJECTED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

type Props = {
  loading: boolean;
  requisitions: any[];
  onView: (req: any) => void;
  onApprove: (reqId: string) => void;
  onReject: (req: any) => void;
  onIssue: (req: any) => void;
  approving: boolean;
};

const MaterialsTab = ({
  loading,
  requisitions,
  onView,
  onApprove,
  onReject,
  onIssue,
  approving,
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Requisitions (This Job)</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : requisitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No requisitions for this job
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {requisitions.map((req: any) => (
                <Card key={req.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-medium">
                          {req.requisitionNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(req.requestedDate).toLocaleString()}
                        </div>
                      </div>

                      <Badge className={getRequisitionStatusColor(req.status)}>
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="text-sm">
                      Items:{" "}
                      <span className="font-medium">{req.items.length}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(req)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>

                      {req.status === RequisitionStatus.PENDING && (
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

                      {(req.status === RequisitionStatus.APPROVED ||
                        req.status === RequisitionStatus.PARTIALLY_ISSUED) && (
                        <Button size="sm" onClick={() => onIssue(req)}>
                          Issue
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
                    <TableHead>Req #</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requisitions.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-medium">
                        {req.requisitionNumber}
                      </TableCell>

                      <TableCell className="text-sm">
                        {req.technician?.user?.firstName}{" "}
                        {req.technician?.user?.lastName}
                      </TableCell>

                      <TableCell>{req.items.length}</TableCell>

                      <TableCell className="text-sm">
                        {new Date(req.requestedDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <Badge className={getRequisitionStatusColor(req.status)}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(req)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {req.status === RequisitionStatus.PENDING && (
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

                          {(req.status === RequisitionStatus.APPROVED ||
                            req.status ===
                              RequisitionStatus.PARTIALLY_ISSUED) && (
                            <Button size="sm" onClick={() => onIssue(req)}>
                              Issue Items
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

export default MaterialsTab;