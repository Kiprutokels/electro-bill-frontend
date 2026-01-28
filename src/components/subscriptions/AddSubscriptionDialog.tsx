import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar } from "lucide-react";
import { customersService, Customer } from "@/api/services/customers.service";
import { productsService } from "@/api/services/products.service";
import {
  subscriptionsService,
  CreateSubscriptionRequest,
  Subscription,
} from "@/api/services/subscriptions.service";
import { toast } from "sonner";
import { validateRequired } from "@/utils/validation.utils";
import { Checkbox } from "@/components/ui/checkbox";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionAdded: (subscription: Subscription) => void;
}

const isValidImei = (v: string) => /^\d{10,20}$/.test(v.trim());

const AddSubscriptionDialog: React.FC<AddSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  onSubscriptionAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    customerId: "",
    productId: "",
    deviceImei: "",
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    autoRenew: false,
    renewalPrice: undefined,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchProducts();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const expiryDate = new Date(
        startDate.getFullYear() + 1,
        startDate.getMonth(),
        startDate.getDate(),
      );
      setFormData((prev) => ({
        ...prev,
        expiryDate: expiryDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.startDate]);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getCustomers();
      const customersData = Array.isArray(response) ? response : response.data;
      setCustomers(customersData.filter((c: Customer) => c.isActive));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to fetch customers");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsService.getAll();
      const productsData = Array.isArray(response) ? response : (response as any).data;
      setProducts(productsData.filter((p: any) => p.isActive));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const customerError = validateRequired(formData.customerId, "Customer");
    if (customerError) newErrors.customerId = customerError;

    const productError = validateRequired(formData.productId, "Product");
    if (productError) newErrors.productId = productError;

    const startDateError = validateRequired(formData.startDate, "Start Date");
    if (startDateError) newErrors.startDate = startDateError;

    const expiryDateError = validateRequired(
      formData.expiryDate,
      "Expiry Date",
    );
    if (expiryDateError) newErrors.expiryDate = expiryDateError;

    if (formData.startDate && formData.expiryDate) {
      const start = new Date(formData.startDate);
      const expiry = new Date(formData.expiryDate);
      if (expiry <= start)
        newErrors.expiryDate = "Expiry date must be after start date";
    }

    if (formData.deviceImei && formData.deviceImei.trim().length > 0) {
      if (!isValidImei(formData.deviceImei)) {
        newErrors.deviceImei = "Device IMEI must be numeric (10-20 digits)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: CreateSubscriptionRequest = {
        ...formData,
        deviceImei: formData.deviceImei?.trim()
          ? formData.deviceImei.trim()
          : undefined,
      };

      const newSubscription = await subscriptionsService.create(payload);
      onSubscriptionAdded(newSubscription);
      onOpenChange(false);
      toast.success("Subscription created successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create subscription";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    setFormData({
      customerId: "",
      productId: "",
      deviceImei: "",
      startDate: today,
      expiryDate: oneYearLater.toISOString().split("T")[0],
      autoRenew: false,
      renewalPrice: undefined,
      notes: "",
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Subscription
          </DialogTitle>
          <DialogDescription>
            Create a subscription for a customer and product
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, customerId: value }))
                }
              >
                <SelectTrigger
                  className={errors.customerId ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.businessName || customer.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.customerId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="productId">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, productId: value }))
                }
              >
                <SelectTrigger
                  className={errors.productId ? "border-destructive" : ""}
                >
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
              {errors.productId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.productId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deviceImei">Device IMEI (optional)</Label>
              <Input
                id="deviceImei"
                value={formData.deviceImei || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deviceImei: e.target.value,
                  }))
                }
                placeholder="e.g. 353549090597591"
                className={errors.deviceImei ? "border-destructive" : ""}
              />
              {errors.deviceImei && (
                <p className="text-sm text-destructive mt-1">
                  {errors.deviceImei}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                If provided, device must be ACTIVE.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="autoRenew"
                checked={!!formData.autoRenew}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, autoRenew: !!checked }))
                }
              />
              <Label htmlFor="autoRenew" className="cursor-pointer">
                Auto-renew subscription
              </Label>
            </div>

            <div>
              <Label htmlFor="startDate">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.startDate}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expiryDate">
                Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                className={errors.expiryDate ? "border-destructive" : ""}
              />
              {errors.expiryDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="renewalPrice">Renewal Price</Label>
              <Input
                id="renewalPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.renewalPrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    renewalPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter renewal price"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Subscription"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscriptionDialog;
