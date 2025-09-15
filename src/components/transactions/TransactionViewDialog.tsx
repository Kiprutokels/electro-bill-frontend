import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Calendar,
  User,
  Building2,
  Users,
} from "lucide-react";
import { Transaction, TransactionType } from "@/api/types/transaction.types";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format.utils";

interface TransactionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

const TransactionViewDialog = ({
  open,
  onOpenChange,
  transaction,
}: TransactionViewDialogProps) => {
  const getTransactionTypeInfo = (type: TransactionType) => {
    const typeConfigs = {
      [TransactionType.INVOICE]: {
        icon: ArrowUpCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "Invoice",
        description: "Revenue transaction from sales",
      },
      [TransactionType.RECEIPT]: {
        icon: ArrowDownCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "Receipt",
        description: "Payment received from customer",
      },
      [TransactionType.PURCHASE]: {
        icon: ArrowUpCircle,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        label: "Purchase",
        description: "Purchase transaction",
      },
      [TransactionType.PAYMENT]: {
        icon: ArrowDownCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        label: "Payment",
        description: "Payment made to supplier",
      },
      [TransactionType.ADJUSTMENT]: {
        icon: FileText,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        label: "Adjustment",
        description: "Account balance adjustment",
      },
      [TransactionType.CREDIT_NOTE]: {
        icon: ArrowDownCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "Credit Note",
        description: "Credit note issued",
      },
    };

    return typeConfigs[type];
  };

  const typeInfo = getTransactionTypeInfo(transaction.transactionType);
  const Icon = typeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${typeInfo.color}`} />
            <span>Transaction Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="font-mono">
                    {transaction.transactionNumber}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {typeInfo.description}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`${typeInfo.bgColor} ${typeInfo.color} w-fit`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {typeInfo.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Transaction Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Transaction Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">
                    {formatDate(transaction.transactionDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm font-medium">
                    {formatDateTime(transaction.createdAt)}
                  </span>
                </div>
                {transaction.referenceId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reference:</span>
                    <span className="text-sm font-medium font-mono">
                      {transaction.referenceId}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  {transaction.customer && <Users className="h-4 w-4" />}
                  {transaction.supplier && <Building2 className="h-4 w-4" />}
                  {!transaction.customer && !transaction.supplier && <User className="h-4 w-4" />}
                  <span>
                    {transaction.customer && "Customer"}
                    {transaction.supplier && "Supplier"}
                    {!transaction.customer && !transaction.supplier && "System"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transaction.customer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <span className="text-sm font-medium">
                        {transaction.customer.customerCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium">
                        {transaction.customer.businessName ||
                          transaction.customer.contactPerson}
                      </span>
                    </div>
                  </>
                )}
                {transaction.supplier && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <span className="text-sm font-medium">
                        {transaction.supplier.supplierCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Company:</span>
                      <span className="text-sm font-medium">
                        {transaction.supplier.companyName}
                      </span>
                    </div>
                  </>
                )}
                {!transaction.customer && !transaction.supplier && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    System-generated transaction
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Debit Amount</div>
                  <div className={`text-lg font-bold ${
                    Number(transaction.debit) > 0 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {Number(transaction.debit) > 0 
                      ? formatCurrency(Number(transaction.debit))
                      : '-'
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Credit Amount</div>
                  <div className={`text-lg font-bold ${
                    Number(transaction.credit) > 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {Number(transaction.credit) > 0 
                      ? formatCurrency(Number(transaction.credit))
                      : '-'
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Balance B/F</div>
                  <div className={`text-lg font-bold ${
                    Number(transaction.balanceBf) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Number(transaction.balanceBf))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Balance C/F</div>
                  <div className={`text-lg font-bold ${
                    Number(transaction.balanceCf) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Number(transaction.balanceCf))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description and Notes */}
          {(transaction.description || transaction.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.description && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Description:
                    </div>
                    <div className="text-sm p-3 bg-muted rounded-lg">
                      {transaction.description}
                    </div>
                  </div>
                )}
                {transaction.notes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Notes:
                    </div>
                    <div className="text-sm p-3 bg-muted rounded-lg">
                      {transaction.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Created By */}
          {transaction.createdByUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Created By</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {transaction.createdByUser.firstName} {transaction.createdByUser.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(transaction.createdAt)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionViewDialog;
