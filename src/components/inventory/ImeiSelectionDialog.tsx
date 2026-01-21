import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, CheckCircle } from "lucide-react";
import { ProductImei } from "@/api/types/imei.types";
import { imeiService } from "@/api/services/imei.service";
import { formatDate } from "@/utils/format.utils";
import { toast } from "sonner";

interface ImeiSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  batchId: string;
  requiredCount: number;
  onConfirm: (selectedImeis: string[]) => void;
}

const ImeiSelectionDialog: React.FC<ImeiSelectionDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  batchId,
  requiredCount,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableImeis, setAvailableImeis] = useState<ProductImei[]>([]);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchAvailableImeis();
      setSelectedImeis([]);
    }
  }, [open, productId, batchId]);

  const fetchAvailableImeis = async () => {
    setLoading(true);
    try {
      const imeis = await imeiService.getAvailableImeis(productId, batchId);
      setAvailableImeis(imeis);
    } catch (error) {
      console.error("Failed to fetch IMEI numbers:", error);
      toast.error("Failed to load IMEI numbers");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImei = (imeiNumber: string) => {
    if (selectedImeis.includes(imeiNumber)) {
      setSelectedImeis(selectedImeis.filter((i) => i !== imeiNumber));
    } else {
      if (selectedImeis.length >= requiredCount) {
        toast.error(`You can only select ${requiredCount} IMEI numbers`);
        return;
      }
      setSelectedImeis([...selectedImeis, imeiNumber]);
    }
  };

  const handleConfirm = () => {
    if (selectedImeis.length !== requiredCount) {
      toast.error(`Please select exactly ${requiredCount} IMEI numbers`);
      return;
    }

    onConfirm(selectedImeis);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Select IMEI Numbers
          </DialogTitle>
          <DialogDescription>
            Select {requiredCount} IMEI number(s) for <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {selectedImeis.length} / {requiredCount} selected
            </Badge>
            <Badge variant={availableImeis.length >= requiredCount ? "default" : "destructive"}>
              {availableImeis.length} available
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : availableImeis.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No IMEI numbers available for this product/batch.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You can skip this step or add IMEI numbers to inventory first.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {availableImeis.map((imei) => {
                const isSelected = selectedImeis.includes(imei.imeiNumber);
                return (
                  <div
                    key={imei.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => handleToggleImei(imei.imeiNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleImei(imei.imeiNumber)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">
                            {imei.imeiNumber}
                          </span>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Added: {formatDate(imei.createdAt)}
                          {imei.notes && (
                            <span className="ml-2">• {imei.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
          >
            Skip (No IMEI)
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedImeis.length === 0 || loading}
          >
            Confirm ({selectedImeis.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImeiSelectionDialog;
