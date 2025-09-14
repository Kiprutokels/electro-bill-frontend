import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, MoreHorizontal, Edit, Trash2, Power, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client/axios";
import { PaymentMethod } from "@/api/types/payment.types";

interface PaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_TYPES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card Payment' },
];

const PaymentMethodsDialog: React.FC<PaymentMethodsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/payment-methods?includeInactive=true');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Payment method name is required";
    }

    if (!formData.type) {
      newErrors.type = "Payment type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setActionLoading(editingMethod ? 'update' : 'create');
    try {
      if (editingMethod) {
        // Update existing method
        const response = await apiClient.put(`/payment-methods/${editingMethod.id}`, {
          name: formData.name.trim(),
          type: formData.type,
        });
        
        setPaymentMethods(prev => prev.map(method => 
          method.id === editingMethod.id ? response.data : method
        ));
        toast.success("Payment method updated successfully");
      } else {
        // Create new method
        const response = await apiClient.post('/payment-methods', {
          name: formData.name.trim(),
          type: formData.type,
          isActive: true,
        });
        
        setPaymentMethods(prev => [response.data, ...prev]);
        toast.success("Payment method created successfully");
      }

      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
        `Failed to ${editingMethod ? 'update' : 'create'} payment method`;
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", type: "" });
    setErrors({});
    setShowAddForm(false);
    setEditingMethod(null);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
    });
    setShowAddForm(true);
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    setActionLoading(`toggle-${method.id}`);
    try {
      const response = await apiClient.patch(`/payment-methods/${method.id}/toggle-status`);
      
      setPaymentMethods(prev => prev.map(m => 
        m.id === method.id ? response.data : m
      ));
      
      toast.success(`Payment method ${response.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update payment method status';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${method.id}`);
    try {
      await apiClient.delete(`/payment-methods/${method.id}`);
      
      setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
      toast.success("Payment method deleted successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete payment method';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeLabel = (type: string) => {
    return PAYMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Payment Method Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Cash, M-Pesa, Bank Transfer"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">Payment Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-sm text-destructive mt-1">{errors.type}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={!!actionLoading}
                    >
                      {actionLoading === 'create' || actionLoading === 'update' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingMethod ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingMethod ? 'Update Method' : 'Create Method'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment Methods ({paymentMethods.length})</CardTitle>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment methods configured yet.</p>
                  <Button 
                    onClick={() => setShowAddForm(true)} 
                    variant="outline" 
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Payment Method
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethods.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell className="font-medium">
                            {method.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTypeLabel(method.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={method.isActive ? "default" : "secondary"}
                              className={method.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {method.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {method._count?.receipts || 0} receipts
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={!!actionLoading}
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(method)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(method)}
                                  disabled={actionLoading === `toggle-${method.id}`}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  {method.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>

                                {(method._count?.receipts || 0) === 0 && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(method)}
                                    className="text-red-600"
                                    disabled={actionLoading === `delete-${method.id}`}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodsDialog;
