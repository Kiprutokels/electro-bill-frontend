import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: any | null;

  batchesData: Record<string, any[]>;
  batchesLoading: boolean;

  issueQuantities: Record<string, number>;
  setIssueQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  issueBatches: Record<string, string>;
  setIssueBatches: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  selectedItemImeis: Record<string, string[]>;
  onSelectImei: (item: any) => void;

  onSubmit: () => void;
  submitting: boolean;
};

const RequisitionIssueDialog = ({
  open,
  onOpenChange,
  requisition,
  batchesData,
  batchesLoading,
  issueQuantities,
  setIssueQuantities,
  issueBatches,
  setIssueBatches,
  selectedItemImeis,
  onSelectImei,
  onSubmit,
  submitting,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Items</DialogTitle>
          <DialogDescription>
            Select batch, set issue qty, and select IMEIs for each item.
          </DialogDescription>
        </DialogHeader>

        {batchesLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border bg-muted/30 text-sm">
              <div className="font-medium">Important</div>
              <div className="text-muted-foreground">
                If batch shows stock but IMEI list is empty, it means the batch
                has inventory but no AVAILABLE device records (IMEIs) were stocked
                for that batch.
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">Batch</TableHead>
                    <TableHead className="text-center">Issue Qty</TableHead>
                    <TableHead className="text-center">IMEI</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requisition?.items.map((item: any) => {
                    const remaining = item.quantityRequested - item.quantityIssued;
                    const batches = batchesData?.[item.id] || [];

                    const qty = issueQuantities[item.id] || 0;
                    const batchId = issueBatches[item.id] || "";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.product.sku}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={remaining > 0 ? "destructive" : "default"}>
                            {remaining}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm w-[220px]"
                            value={batchId}
                            onChange={(e) =>
                              setIssueBatches((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            disabled={remaining === 0}
                          >
                            <option value="">Select batch</option>
                            {batches.map((b: any) => (
                              <option
                                key={b.id}
                                value={b.id}
                                disabled={b.quantityRemaining === 0}
                              >
                                {b.batchNumber} • {b.quantityRemaining} left
                              </option>
                            ))}
                          </select>
                        </TableCell>

                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 0;
                              setIssueQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.min(Math.max(0, v), remaining),
                              }));
                            }}
                            className="w-24 text-center"
                            disabled={remaining === 0}
                          />
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!batchId) return toast.error("Select batch first");
                              if (qty <= 0) return toast.error("Enter quantity first");
                              onSelectImei(item);
                            }}
                            disabled={!batchId || qty <= 0}
                          >
                            <Smartphone className="h-4 w-4 mr-1" />
                            {selectedItemImeis[item.id]?.length
                              ? `${selectedItemImeis[item.id].length} Selected`
                              : "Select IMEI"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || batchesLoading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequisitionIssueDialog;
