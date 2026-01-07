import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, CalendarClock } from 'lucide-react';
import { jobsService, Job } from '@/api/services/jobs.service';

interface RescheduleJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const RescheduleJobDialog = ({ open, onOpenChange, job }: RescheduleJobDialogProps) => {
  const queryClient = useQueryClient();
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [reason, setReason] = useState('');
  const [notifyTechnician, setNotifyTechnician] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      jobsService.rescheduleJob(job!.id, {
        newScheduledDate,
        reason,
        notifyTechnician,
        notifyCustomer,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-by-id', job?.id] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Job rescheduled successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule job');
    },
  });

  const resetForm = () => {
    setNewScheduledDate('');
    setReason('');
    setNotifyTechnician(true);
    setNotifyCustomer(true);
  };

  const handleSubmit = () => {
    if (!newScheduledDate) {
      toast.error('Please select a new scheduled date');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }

    const selectedDate = new Date(newScheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Cannot reschedule to a past date');
      return;
    }

    rescheduleMutation.mutate();
  };

  if (!job) return null;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Reschedule Job
          </DialogTitle>
          <DialogDescription>
            Change the scheduled date for job {job.jobNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Scheduled Date */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground">Current Scheduled Date</Label>
            <p className="font-medium">
              {new Date(job.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* New Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="newScheduledDate">
              New Scheduled Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newScheduledDate"
              type="date"
              min={minDateString}
              value={newScheduledDate}
              onChange={(e) => setNewScheduledDate(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Reschedule <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Customer requested change, technical issues, resource availability..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Notification Options */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Notify</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyTechnician"
                  checked={notifyTechnician}
                  onCheckedChange={(checked) => setNotifyTechnician(checked as boolean)}
                />
                <label
                  htmlFor="notifyTechnician"
                  className="text-sm cursor-pointer"
                >
                  Send email to assigned technician(s)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyCustomer"
                  checked={notifyCustomer}
                  onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                />
                <label
                  htmlFor="notifyCustomer"
                  className="text-sm cursor-pointer"
                >
                  Send email to customer
                </label>
              </div>
            </div>
          </div>

          {/* Reschedule History */}
          {job.rescheduleHistory && job.rescheduleHistory.length > 0 && (
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">
                Previous Reschedules ({job.rescheduleHistory.length})
              </Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {job.rescheduleHistory.map((history, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted rounded">
                    <p>
                      {new Date(history.oldDate).toLocaleDateString()} →{' '}
                      {new Date(history.newDate).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">{history.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rescheduleMutation.isPending}
          >
            {rescheduleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleJobDialog;
