import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar,
  User,
  Building,
  Hash,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Customer } from '@/api/services/customers.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/utils/constants';

interface CustomerViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const CustomerViewDialog: React.FC<CustomerViewDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = useAuth();

  const getStatusBadge = () => {
    if (!customer.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const balance = customer.currentBalance || 0;
    const creditLimit = customer.creditLimit || 0;
    
    if (balance > creditLimit && creditLimit > 0) {
      return <Badge variant="destructive">Credit Exceeded</Badge>;
    } else if (balance > creditLimit * 0.8 && creditLimit > 0) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Near Limit</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Customer Details</DialogTitle>
            <div className="flex gap-2">
              {hasPermission(PERMISSIONS.CUSTOMERS_UPDATE) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleStatus}
                  >
                    {customer.isActive ? (
                      <><ToggleLeft className="mr-1 h-4 w-4" /> Deactivate</>
                    ) : (
                      <><ToggleRight className="mr-1 h-4 w-4" /> Activate</>
                    )}
                  </Button>
                  <Button size="sm" onClick={onEdit}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Hash className="mr-2 h-4 w-4" />
                  Customer Code
                </div>
                <div className="font-medium">{customer.customerCode}</div>
              </div>

              {customer.businessName && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="mr-2 h-4 w-4" />
                    Business Name
                  </div>
                  <div className="font-medium">{customer.businessName}</div>
                </div>
              )}

              {customer.contactPerson && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    Contact Person
                  </div>
                  <div className="font-medium">{customer.contactPerson}</div>
                </div>
              )}

              {customer.taxNumber && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Hash className="mr-2 h-4 w-4" />
                    Tax Number
                  </div>
                  <div className="font-medium">{customer.taxNumber}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{customer.phone}</div>
                  <div className="text-sm text-muted-foreground">Primary Phone</div>
                </div>
              </div>

              {customer.alternatePhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{customer.alternatePhone}</div>
                    <div className="text-sm text-muted-foreground">Alternate Phone</div>
                  </div>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{customer.email}</div>
                    <div className="text-sm text-muted-foreground">Email Address</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          {(customer.addressLine1 || customer.city || customer.country) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="space-y-1">
                    {customer.addressLine1 && <div>{customer.addressLine1}</div>}
                    {customer.addressLine2 && <div>{customer.addressLine2}</div>}
                    <div className="text-muted-foreground">
                      {customer.city && `${customer.city}, `}
                      {customer.country}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Limit
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(customer.creditLimit)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className={`text-xl font-bold ${
                  customer.currentBalance && customer.currentBalance > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {formatCurrency(customer.currentBalance || 0)}
                </div>
              </div>

              {customer.totalPurchases !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Purchases</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(customer.totalPurchases)}
                  </div>
                </div>
              )}

              {customer._count && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Invoices</div>
                  <div className="text-xl font-bold">
                    {customer._count.invoices}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created Date
                </div>
                <div className="font-medium">{formatDate(customer.createdAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last Updated
                </div>
                <div className="font-medium">{formatDate(customer.updatedAt)}</div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {customer._count && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Statistics</h3>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {customer._count.invoices}
                    </div>
                    <div className="text-sm text-muted-foreground">Invoices</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {customer._count.receipts}
                    </div>
                    <div className="text-sm text-muted-foreground">Receipts</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {customer._count.transactions}
                    </div>
                    <div className="text-sm text-muted-foreground">Transactions</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerViewDialog;
