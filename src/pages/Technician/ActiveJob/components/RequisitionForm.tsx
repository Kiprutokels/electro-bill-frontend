import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Minus,
  Loader2,
  Send,
  Check,
  ChevronsUpDown,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { requisitionsService } from "@/api/services/requisitions.service";
import { productsService } from "@/api/services/products.service";
import {
  advanceRequestsService,
  AdvanceRequestType,
  AdvanceRequestStatus,
} from "@/api/services/advance-requests.service";
import { cn } from "@/lib/utils";
import React from "react";

interface FormItem {
  productId: string;
  productName: string;
  quantityRequested: number;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  totalAvailable: number;
}

interface RequisitionFormProps {
  job: any;
  onComplete?: () => void;
}

const RequisitionForm = ({ job, onComplete }: RequisitionFormProps) => {
  const queryClient = useQueryClient();

  // Material Requisition State
  const [items, setItems] = useState<FormItem[]>([
    { productId: "", productName: "", quantityRequested: 1 },
  ]);
  const [notes, setNotes] = useState("");
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [debouncedQueries, setDebouncedQueries] = useState<Record<number, string>>({});
  const [openProductSelects, setOpenProductSelects] = useState<Record<number, boolean>>({});

  // Advance Request State
  const [advanceFormData, setAdvanceFormData] = useState({
    requestType: AdvanceRequestType.TRANSPORT,
    amount: "",
    description: "",
    justification: "",
  });

  // Debounce search queries per index
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    Object.entries(searchQueries).forEach(([indexStr, query]) => {
      const index = parseInt(indexStr);
      const timer = setTimeout(() => {
        setDebouncedQueries((prev) => ({
          ...prev,
          [index]: query,
        }));
      }, 300);

      timers.push(timer);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [searchQueries]);

  // Fetch material requisitions
  const { data: requisitionsData } = useQuery({
    queryKey: ["job-requisitions", job.id],
    queryFn: () => requisitionsService.getRequisitions({ jobId: job.id }),
  });

  // Fetch advance requests
  const { data: advanceRequestsData } = useQuery({
    queryKey: ["job-advance-requests", job.id],
    queryFn: () => advanceRequestsService.getAdvanceRequests({ jobId: job.id }),
  });

  // Create material requisition mutation
  const createMaterialMutation = useMutation({
    mutationFn: requisitionsService.createRequisition,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-requisitions"] });
      await queryClient.invalidateQueries({ queryKey: ["active-job"] });
      await queryClient.invalidateQueries({ queryKey: ["job-by-id", job.id] });
      toast.success("Requisition created successfully");
      setItems([{ productId: "", productName: "", quantityRequested: 1 }]);
      setNotes("");
      setSearchQueries({});
      setDebouncedQueries({});
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create requisition");
    },
  });

  // Create advance request mutation
  const createAdvanceMutation = useMutation({
    mutationFn: advanceRequestsService.createAdvanceRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-advance-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["active-job"] });
      toast.success("Advance request submitted successfully");
      setAdvanceFormData({
        requestType: AdvanceRequestType.TRANSPORT,
        amount: "",
        description: "",
        justification: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create advance request");
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", productName: "", quantityRequested: 1 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));

    // Clean up search states for removed item
    setSearchQueries((prev) => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    setDebouncedQueries((prev) => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    setOpenProductSelects((prev) => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleProductSelect = (index: number, product: ProductOption) => {
    const updated = [...items];
    updated[index] = {
      productId: product.id,
      productName: `${product.name} (${product.sku})`,
      quantityRequested: updated[index].quantityRequested || 1,
    };
    setItems(updated);
    setOpenProductSelects((prev) => ({ ...prev, [index]: false }));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantityRequested = Math.max(1, Math.floor(quantity));
    setItems(updated);
  };

  const handleSearchChange = (index: number, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmitMaterial = () => {
    const hasInvalidItems = items.some(
      (item) =>
        !item.productId ||
        item.productId.trim() === "" ||
        item.quantityRequested <= 0
    );

    if (hasInvalidItems) {
      toast.error("Please fill all item details correctly");
      return;
    }

    createMaterialMutation.mutate({
      jobId: job.id,
      items: items.map((item) => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested,
      })),
      notes: notes.trim() || undefined,
    });
  };

  const handleSubmitAdvance = () => {
    if (!advanceFormData.amount || parseFloat(advanceFormData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!advanceFormData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    createAdvanceMutation.mutate({
      jobId: job.id,
      requestType: advanceFormData.requestType,
      amount: parseFloat(advanceFormData.amount),
      description: advanceFormData.description,
      justification: advanceFormData.justification || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
      APPROVED: { color: "bg-blue-500", icon: CheckCircle, label: "Approved" },
      DISBURSED: { color: "bg-green-500", icon: CheckCircle, label: "Disbursed" },
      REJECTED: { color: "bg-red-500", icon: XCircle, label: "Rejected" },
      PARTIALLY_ISSUED: {
        color: "bg-orange-500",
        icon: Package,
        label: "Partially Issued",
      },
      FULLY_ISSUED: {
        color: "bg-green-500",
        icon: CheckCircle,
        label: "Fully Issued",
      },
    };

    const { color, icon: Icon, label } = config[status] || config.PENDING;
    return (
      <Badge className={`${color} text-white text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const requisitions = requisitionsData?.data || [];
  const advanceRequests = advanceRequestsData?.data || [];

  return (
    <Tabs defaultValue="materials" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="materials" className="flex items-center gap-2 text-xs sm:text-sm">
          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Material Requisition</span>
          <span className="sm:hidden">Materials</span>
        </TabsTrigger>
        <TabsTrigger value="advance" className="flex items-center gap-2 text-xs sm:text-sm">
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Financial Advance</span>
          <span className="sm:hidden">Advance</span>
        </TabsTrigger>
      </TabsList>

      {/* ============= MATERIAL REQUISITION TAB ============= */}
      <TabsContent value="materials" className="space-y-4 sm:space-y-6">
        {/* Existing Requisitions */}
        {requisitions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Requisition History</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {requisitions.map((req: any) => (
                  <AccordionItem key={req.id} value={req.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-start justify-between w-full pr-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono font-medium text-xs sm:text-sm">
                              {req.requisitionNumber}
                            </span>
                            {getStatusBadge(req.status)}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground text-left">
                            {req.items.length} item{req.items.length !== 1 ? "s" : ""} •{" "}
                            {new Date(req.requestedDate).toLocaleDateString()}
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {req.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs sm:text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.product.sku}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <Badge variant="outline" className="text-xs">
                                Req: {item.quantityRequested}
                              </Badge>
                              <Badge
                                variant={item.quantityIssued > 0 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                Issued: {item.quantityIssued}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {req.notes && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <span className="font-medium">Notes:</span> {req.notes}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Create New Requisition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Request Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">
                  Items <span className="text-destructive">*</span>
                </Label>
                <Button type="button" size="sm" onClick={handleAddItem} className="h-8 text-xs">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3 border rounded-lg p-2 sm:p-4 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center text-xs sm:text-sm text-muted-foreground py-4">
                    No items added yet
                  </div>
                ) : (
                  items.map((item, index) => (
                    <ProductSearchDropdown
                      key={index}
                      index={index}
                      item={item}
                      isOpen={!!openProductSelects[index]}
                      onOpenChange={(open) =>
                        setOpenProductSelects((prev) => ({ ...prev, [index]: open }))
                      }
                      onProductSelect={handleProductSelect}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                      searchQuery={searchQueries[index] || ""}
                      onSearchChange={(value) => handleSearchChange(index, value)}
                      debouncedQuery={debouncedQueries[index] || ""}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitMaterial}
                disabled={createMaterialMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createMaterialMutation.isPending ? (
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
      </TabsContent>

      {/* ============= FINANCIAL ADVANCE TAB ============= */}
      <TabsContent value="advance" className="space-y-4 sm:space-y-6">
        {/* Existing Advance Requests */}
        {advanceRequests.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                Advance Request History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {advanceRequests.map((req: any) => (
                  <div key={req.id} className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-medium text-xs sm:text-sm">
                            {req.requestNumber}
                          </span>
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-primary shrink-0">
                        KES {parseFloat(req.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium">
                          {req.requestType.replace("_", " ")}
                        </span>{" "}
                        • {req.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(req.requestedDate).toLocaleDateString()}
                      </div>
                      {req.disbursedDate && (
                        <div className="text-xs text-green-600">
                          Disbursed: {new Date(req.disbursedDate).toLocaleDateString()}
                          {req.disbursementMethod && ` via ${req.disbursementMethod}`}
                          {req.referenceNumber && ` • Ref: ${req.referenceNumber}`}
                        </div>
                      )}
                      {req.rejectionReason && (
                        <div className="text-xs text-red-600">
                          Rejected: {req.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Advance Request */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Request Financial Advance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestType" className="text-xs sm:text-sm">
                  Request Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={advanceFormData.requestType}
                  onValueChange={(val) =>
                    setAdvanceFormData({
                      ...advanceFormData,
                      requestType: val as AdvanceRequestType,
                    })
                  }
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AdvanceRequestType.TRANSPORT}>
                      Transport
                    </SelectItem>
                    <SelectItem value={AdvanceRequestType.TOOLS}>
                      Tools & Equipment
                    </SelectItem>
                    <SelectItem value={AdvanceRequestType.ACCOMMODATION}>
                      Accommodation
                    </SelectItem>
                    <SelectItem value={AdvanceRequestType.MEALS}>Meals</SelectItem>
                    <SelectItem value={AdvanceRequestType.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs sm:text-sm">
                  Amount (KES) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={advanceFormData.amount}
                  onChange={(e) =>
                    setAdvanceFormData({ ...advanceFormData, amount: e.target.value })
                  }
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Brief description of the advance"
                value={advanceFormData.description}
                onChange={(e) =>
                  setAdvanceFormData({
                    ...advanceFormData,
                    description: e.target.value,
                  })
                }
                maxLength={500}
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification" className="text-xs sm:text-sm">
                Justification (Optional)
              </Label>
              <Textarea
                id="justification"
                placeholder="Provide detailed justification for this advance request..."
                value={advanceFormData.justification}
                onChange={(e) =>
                  setAdvanceFormData({
                    ...advanceFormData,
                    justification: e.target.value,
                  })
                }
                rows={3}
                maxLength={1000}
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitAdvance}
                disabled={createAdvanceMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createAdvanceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

// Separate component for each product dropdown to isolate state
interface ProductSearchDropdownProps {
  index: number;
  item: FormItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (index: number, product: ProductOption) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  debouncedQuery: string;
}

const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  index,
  item,
  isOpen,
  onOpenChange,
  onProductSelect,
  onQuantityChange,
  onRemove,
  searchQuery,
  onSearchChange,
  debouncedQuery,
}) => {
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["product-search", index, debouncedQuery],
    queryFn: () => productsService.searchProducts(debouncedQuery, 10),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end">
      <div className="col-span-7 sm:col-span-8">
        <Label htmlFor={`product-${index}`} className="text-xs">
          Product
        </Label>
        <Popover open={isOpen} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between text-xs sm:text-sm h-9",
                !item.productId && "text-muted-foreground"
              )}
            >
              <span className="truncate">{item.productName || "Search product..."}</span>
              <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] sm:w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search products..."
                value={searchQuery}
                onValueChange={onSearchChange}
                className="text-xs sm:text-sm"
              />
              <CommandList>
                <CommandEmpty className="text-xs sm:text-sm py-4">
                  {isSearching ? "Searching..." : "No products found."}
                </CommandEmpty>
                <CommandGroup>
                  {searchResults.map((product: ProductOption) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.sku}`}
                      onSelect={() => onProductSelect(index, product)}
                      className="text-xs sm:text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3 sm:h-4 sm:w-4",
                          item.productId === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.sku} • Available: {product.totalAvailable}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="col-span-4 sm:col-span-3">
        <Label htmlFor={`quantity-${index}`} className="text-xs">
          Qty
        </Label>
        <Input
          id={`quantity-${index}`}
          type="number"
          min="1"
          value={item.quantityRequested}
          onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 1)}
          className="text-xs sm:text-sm h-9"
        />
      </div>
      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive h-9 w-9 p-0"
        >
          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RequisitionForm;
