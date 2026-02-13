import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: any | null;
  onApprove: (reqId: string) => void;
  onReject: (req: any) => void;
  onIssue: (req: any) => void;
  approving: boolean;
};

const RequisitionViewDialog = ({
  open,
  onOpenChange,
  requisition,
  onApprove,
  onReject,
  onIssue,
  approving,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Requisition Details</DialogTitle>
          <DialogDescription>
            Review items and take actions (approve/reject/issue)
          </DialogDescription>
        </DialogHeader>

        {requisition && (
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-mono font-medium text-lg">
                  {requisition.requisitionNumber}
                </div>
                <div className="text-sm text-muted-foreground">
                  Requested: {new Date(requisition.requestedDate).toLocaleString()}
                </div>
              </div>

              <Badge className={getRequisitionStatusColor(requisition.status)}>
                {requisition.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Requested</TableHead>
                    <TableHead className="text-center">Issued</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requisition.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product.name}{" "}
                        <span className="text-muted-foreground">
                          ({item.product.sku})
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{item.quantityRequested}</TableCell>
                      <TableCell className="text-center">{item.quantityIssued}</TableCell>
                      <TableCell className="text-center">
                        {item.quantityRequested - item.quantityIssued}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {requisition.notes && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <strong>Notes:</strong> {requisition.notes}
              </div>
            )}

            {requisition.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                <strong>Rejection:</strong> {requisition.rejectionReason}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {requisition?.status === RequisitionStatus.PENDING && (
            <>
              <Button
                onClick={() => onApprove(requisition.id)}
                disabled={approving}
              >
                {approving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve
              </Button>

              <Button variant="destructive" onClick={() => onReject(requisition)}>
                Reject
              </Button>
            </>
          )}

          {(requisition?.status === RequisitionStatus.APPROVED ||
            requisition?.status === RequisitionStatus.PARTIALLY_ISSUED) && (
            <Button onClick={() => onIssue(requisition)}>Issue Items</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequisitionViewDialog;
