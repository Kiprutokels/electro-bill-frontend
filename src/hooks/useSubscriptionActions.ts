import { useState } from 'react';
import { subscriptionsService, Subscription } from '@/api/services/subscriptions.service';
import { toast } from 'sonner';

export const useSubscriptionActions = () => {
  const [loading, setLoading] = useState(false);

  const cancelSubscription = async (id: string): Promise<Subscription> => {
    setLoading(true);
    try {
      const cancelled = await subscriptionsService.cancel(id);
      toast.success('Subscription cancelled successfully');
      return cancelled;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel subscription';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await subscriptionsService.delete(id);
      toast.success('Subscription deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete subscription';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cancelSubscription,
    deleteSubscription,
  };
};
