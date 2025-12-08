import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Loader2, Send } from "lucide-react";
import { requisitionsService } from "@/api/services/requisitions.service";
import { productsService } from "@/api/services/products.service";

const RequisitionForm = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([{ productId: "", quantityRequested: 1 }]);
  const [notes, setNotes] = useState("");

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const items = await productsService.getAll();
      return { data: items };
    },
  });
  // Fetch existing requisitions for this job
  const { data: requisitionsData } = useQuery({
    queryKey: ["job-requisitions", job.id],
    queryFn: () => requisitionsService.getRequisitions({ jobId: job.id }),
  });

  const createMutation = useMutation({
    mutationFn: requisitionsService.createRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["active-job"] });
      toast.success("Requisition created successfully");
      setItems([{ productId: "", quantityRequested: 1 }]);
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create requisition"
      );
    },
  });

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantityRequested: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: "productId" | "quantityRequested",
    value: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = () => {
    const hasInvalidItems = items.some(
      (item) => !item.productId || item.quantityRequested <= 0
    );

    if (hasInvalidItems) {
      toast.error("Please fill all item details correctly");
      return;
    }

    createMutation.mutate({
      jobId: job.id,
      items,
      notes: notes || undefined,
    });
  };

  const products = productsData?.data || [];
  const requisitions = requisitionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Existing Requisitions */}
      {requisitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requisition History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requisitions.map((req) => (
                <div
                  key={req.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-medium">
                        {req.requisitionNumber}
                      </span>
                      <Badge
                        className={
                          req.status === "APPROVED"
                            ? "bg-green-500"
                            : req.status === "PENDING"
                            ? "bg-yellow-500"
                            : req.status === "REJECTED"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {req.items.length} items requested •{" "}
                      {new Date(req.requestedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Requisition */}
      <Card>
        <CardHeader>
          <CardTitle>Request Materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Items <span className="text-destructive">*</span>
              </Label>
              <Button type="button" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3 border rounded-lg p-4 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No items added yet
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-8">
                      <Label htmlFor={`product-${index}`} className="text-xs">
                        Product
                      </Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) =>
                          handleItemChange(index, "productId", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor={`quantity-${index}`} className="text-xs">
                        Quantity
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantityRequested}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantityRequested",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Requisition
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequisitionForm;
