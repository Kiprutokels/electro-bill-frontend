import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Plus, Minus, Loader2, Send, Check, ChevronsUpDown } from "lucide-react";
import { requisitionsService } from "@/api/services/requisitions.service";
import { productsService } from "@/api/services/products.service";
import { cn } from "@/lib/utils";

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

const RequisitionForm = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<FormItem[]>([{ productId: "", productName: "", quantityRequested: 1 }]);
  const [notes, setNotes] = useState("");
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [debouncedQueries, setDebouncedQueries] = useState<Record<number, string>>({});
  const [openProductSelects, setOpenProductSelects] = useState<Record<number, boolean>>({});

  // Debounce search queries per index
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    Object.entries(searchQueries).forEach(([indexStr, query]) => {
      const index = parseInt(indexStr);
      const timer = setTimeout(() => {
        setDebouncedQueries(prev => ({
          ...prev,
          [index]: query
        }));
      }, 300);

      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [searchQueries]);

  const { data: requisitionsData } = useQuery({
    queryKey: ["job-requisitions", job.id],
    queryFn: () => requisitionsService.getRequisitions({ jobId: job.id }),
  });

  // Memoized search function for each dropdown
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return await productsService.searchProducts(query, 10);
  }, []);

  // Use query for each active search
  const useProductSearch = (index: number) => {
    return useQuery({
      queryKey: ['product-search', index, debouncedQueries[index]],
      queryFn: () => searchProducts(debouncedQueries[index] || ''),
      enabled: !!debouncedQueries[index] && debouncedQueries[index].length >= 2,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
  };

  const createMutation = useMutation({
    mutationFn: requisitionsService.createRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["active-job"] });
      toast.success("Requisition created successfully");
      setItems([{ productId: "", productName: "", quantityRequested: 1 }]);
      setNotes("");
      setSearchQueries({});
      setDebouncedQueries({});
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create requisition"
      );
    },
  });

  const handleAddItem = () => {
    setItems(prev => [...prev, { productId: "", productName: "", quantityRequested: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    
    // Clean up search states for removed item
    setSearchQueries(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    
    setDebouncedQueries(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    
    setOpenProductSelects(prev => {
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
      quantityRequested: updated[index].quantityRequested || 1
    };
    setItems(updated);
    setOpenProductSelects(prev => ({ ...prev, [index]: false }));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantityRequested = Math.max(1, Math.floor(quantity));
    setItems(updated);
  };

  const handleSearchChange = (index: number, value: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    const hasInvalidItems = items.some(
      (item) => !item.productId || item.productId.trim() === '' || item.quantityRequested <= 0
    );

    if (hasInvalidItems) {
      toast.error("Please fill all item details correctly");
      return;
    }

    createMutation.mutate({
      jobId: job.id,
      items: items.map(item => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested
      })),
      notes: notes.trim() || undefined,
    });
  };

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
              {requisitions.map((req: any) => (
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
                  <ProductSearchDropdown
                    key={index}
                    index={index}
                    item={item}
                    isOpen={!!openProductSelects[index]}
                    onOpenChange={(open) => setOpenProductSelects(prev => ({ ...prev, [index]: open }))}
                    onProductSelect={handleProductSelect}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                    searchQuery={searchQueries[index] || ''}
                    onSearchChange={(value) => handleSearchChange(index, value)}
                    debouncedQuery={debouncedQueries[index] || ''}
                  />
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

//  component for each product dropdown to isolate state
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
    queryKey: ['product-search', index, debouncedQuery],
    queryFn: () => productsService.searchProducts(debouncedQuery, 10),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-8">
        <Label htmlFor={`product-${index}`} className="text-xs">
          Product
        </Label>
        <Popover open={isOpen} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                !item.productId && "text-muted-foreground"
              )}
            >
              {item.productName || "Search product..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Search products..."
                value={searchQuery}
                onValueChange={onSearchChange}
              />
              <CommandList>
                <CommandEmpty>
                  {isSearching ? "Searching..." : "No products found."}
                </CommandEmpty>
                <CommandGroup>
                  {searchResults.map((product: ProductOption) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.sku}`}
                      onSelect={() => onProductSelect(index, product)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          item.productId === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
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
            onQuantityChange(index, parseInt(e.target.value) || 1)
          }
        />
      </div>
      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RequisitionForm;