import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { customersService, Customer, CreateCustomerRequest } from '@/api/services/customers.service';
import { validateEmail, validatePhone } from '@/utils/validation.utils';
import { toast } from 'sonner';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: Customer) => void;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  open,
  onOpenChange,
  onCustomerAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    customerCode: '',
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    taxNumber: '',
    creditLimit: 0,
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: 'Kenya',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Phone is required
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Email validation if provided
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Alternate phone validation if provided
    if (formData.alternatePhone && !validatePhone(formData.alternatePhone)) {
      newErrors.alternatePhone = 'Please enter a valid alternate phone number';
    }

    // Credit limit validation
    if (formData.creditLimit && formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit must be greater than or equal to 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanData: CreateCustomerRequest = {} as CreateCustomerRequest;
      
      (Object.keys(formData) as (keyof CreateCustomerRequest)[]).forEach(key => {
        const value = formData[key];
        if (value !== '' && value !== null && value !== undefined) {
          (cleanData as any)[key] = value;
        }
      });

      const newCustomer = await customersService.createCustomer(cleanData);
      onCustomerAdded(newCustomer);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create customer';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerCode: '',
      businessName: '',
      contactPerson: '',
      email: '',
      phone: '',
      alternatePhone: '',
      taxNumber: '',
      creditLimit: 0,
      addressLine1: '',
      addressLine2: '',
      city: '',
      country: 'Kenya',
      isActive: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof CreateCustomerRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Code */}
            <div>
              <Label htmlFor="customerCode">Customer Code</Label>
              <Input
                id="customerCode"
                value={formData.customerCode}
                onChange={(e) => handleInputChange('customerCode', e.target.value)}
                placeholder="Auto-generated if empty"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate
              </p>
            </div>

            {/* Business Name */}
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            {/* Contact Person */}
            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@company.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+254700000000"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* Alternate Phone */}
            <div>
              <Label htmlFor="alternatePhone">Alternate Phone</Label>
              <Input
                id="alternatePhone"
                value={formData.alternatePhone}
                onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                placeholder="+254722000000"
                className={errors.alternatePhone ? 'border-destructive' : ''}
              />
              {errors.alternatePhone && <p className="text-sm text-destructive mt-1">{errors.alternatePhone}</p>}
            </div>

            {/* Tax Number */}
            <div>
              <Label htmlFor="taxNumber">Tax Number/PIN</Label>
              <Input
                id="taxNumber"
                value={formData.taxNumber}
                onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                placeholder="P051234567A"
              />
            </div>

            {/* Credit Limit */}
            <div>
              <Label htmlFor="creditLimit">Credit Limit (KES)</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                className={errors.creditLimit ? 'border-destructive' : ''}
              />
              {errors.creditLimit && <p className="text-sm text-destructive mt-1">{errors.creditLimit}</p>}
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Address Information</h4>
            
            <div>
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                placeholder="Suite 100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Nairobi"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Kenya"
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active Customer</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Adding Customer...' : 'Add Customer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;