import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Send } from "lucide-react";
import {
  AdvanceRequestStatus,
} from "@/api/services/advance-requests.service";

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
  open: boolean;
  onOpenChange: (v: boolean) => void;
  advance: any | null;
  onApprove: (id: string) => void;
  onReject: (adv: any) => void;
  onDisburse: (adv: any) => void;
  approving: boolean;
};

const AdvanceViewDialog = ({
  open,
  onOpenChange,
  advance,
  onApprove,
  onReject,
  onDisburse,
  approving,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advance Request</DialogTitle>
        </DialogHeader>

        {advance && (
          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-mono font-medium text-lg">
                  {advance.requestNumber}
                </div>
                <div className="text-muted-foreground">
                  Requested: {new Date(advance.requestedDate).toLocaleString()}
                </div>
              </div>

              <Badge className={getAdvanceStatusColor(advance.status)}>
                {advance.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-muted-foreground">Type</div>
                <div className="font-medium">
                  {advance.requestType.replace(/_/g, " ")}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-bold text-primary text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  KES {parseFloat(String(advance.amount)).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Description</div>
              <div className="p-3 bg-muted rounded-lg">{advance.description}</div>
            </div>

            {advance.justification && (
              <div>
                <div className="text-muted-foreground">Justification</div>
                <div className="p-3 bg-muted rounded-lg">{advance.justification}</div>
              </div>
            )}

            {advance.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                <strong>Rejected:</strong> {advance.rejectionReason}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {advance?.status === AdvanceRequestStatus.PENDING && (
            <>
              <Button onClick={() => onApprove(advance.id)} disabled={approving}>
                Approve
              </Button>
              <Button variant="destructive" onClick={() => onReject(advance)}>
                Reject
              </Button>
            </>
          )}

          {advance?.status === AdvanceRequestStatus.APPROVED && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onDisburse(advance)}
            >
              <Send className="mr-2 h-4 w-4" />
              Disburse
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceViewDialog;
