import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Eye, Loader2 } from "lucide-react";

type InvoiceProps = {
  isCompleted: boolean;
  checkingInvoice: boolean;
  generatingInvoice: boolean;
  existingInvoiceId: string | null;
  onGenerate: () => void;
  onView: () => void;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500",
    SCHEDULED: "bg-indigo-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-green-600",
    CANCELLED: "bg-red-500",
    REQUISITION_PENDING: "bg-yellow-500",
    REQUISITION_APPROVED: "bg-blue-500",
  };
  return colors[status] || "bg-gray-500";
};

const WorkflowHeader = ({
  jobTitle,
  status,
  onBack,
  invoice,
}: {
  jobTitle: string;
  status: string;
  onBack: () => void;
  invoice: InvoiceProps;
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Job Workflow</h1>
          <p className="text-muted-foreground text-sm">{jobTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={getStatusColor(status)}>{status.replace(/_/g, " ")}</Badge>

        {invoice.isCompleted && (
          <>
            {invoice.checkingInvoice ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </Button>
            ) : invoice.existingInvoiceId ? (
              <Button onClick={invoice.onView}>
                <Eye className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
            ) : (
              <Button onClick={invoice.onGenerate} disabled={invoice.generatingInvoice}>
                {invoice.generatingInvoice ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="mr-2 h-4 w-4" />
                )}
                Generate Invoice
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkflowHeader;