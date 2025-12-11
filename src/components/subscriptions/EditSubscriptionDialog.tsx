import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit } from 'lucide-react';
import { subscriptionsService, UpdateSubscriptionRequest, Subscription } from '@/api/services/subscriptions.service';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface EditSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSubscriptionUpdated: (subscription: Subscription) => void;
}

const EditSubscriptionDialog: React.FC<EditSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  subscription,
  onSubscriptionUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<UpdateSubscriptionRequest>({
    startDate: '',
    expiryDate: '',
    autoRenew: false,
    renewalPrice: undefined,
    notes: '',
  });

  useEffect(() => {
    if (subscription && open) {
      setFormData({
        startDate: subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : '',
        expiryDate: subscription.expiryDate ? new Date(subscription.expiryDate).toISOString().split('T')[0] : '',
        autoRenew: subscription.autoRenew,
        renewalPrice: subscription.renewalPrice ? Number(subscription.renewalPrice) : undefined,
        notes: subscription.notes || '',
      });
      setErrors({});
    }
  }, [subscription, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.startDate && formData.expiryDate) {
      const start = new Date(formData.startDate);
      const expiry = new Date(formData.expiryDate);
      if (expiry <= start) {
        newErrors.expiryDate = 'Expiry date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !subscription) {
      return;
    }

    setLoading(true);
    try {
      const updated = await subscriptionsService.update(subscription.id, formData);
      onSubscriptionUpdated(updated);
      onOpenChange(false);
      toast.success('Subscription updated successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update subscription';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Subscription - {subscription.subscriptionNumber}
          </DialogTitle>
          <DialogDescription>
            Update subscription details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer & Product Info (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">
                  {subscription.customer?.businessName || subscription.customer?.contactPerson || 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <Label>Product</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{subscription.product?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, expiryDate: e.target.value }))
                }
                className={errors.expiryDate ? 'border-destructive' : ''}
              />
              {errors.expiryDate && (
                <p className="text-sm text-destructive mt-1">{errors.expiryDate}</p>
              )}
            </div>

            {/* Renewal Price */}
            <div>
              <Label htmlFor="renewalPrice">Renewal Price</Label>
              <Input
                id="renewalPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.renewalPrice || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    renewalPrice: parseFloat(e.target.value) || undefined
                  }))
                }
              />
            </div>

            {/* Auto Renew */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="autoRenew"
                checked={formData.autoRenew}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, autoRenew: !!checked }))
                }
              />
              <Label htmlFor="autoRenew" className="cursor-pointer">
                Auto-renew subscription
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update Subscription'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubscriptionDialog;
