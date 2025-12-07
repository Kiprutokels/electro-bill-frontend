import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { jobsService, Job } from '@/api/services/jobs.service';

interface CancelJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const CancelJobDialog = ({ open, onOpenChange, job }: CancelJobDialogProps) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => jobsService.cancelJob(job!.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-statistics'] });
      toast.success('Job cancelled successfully');
      onOpenChange(false);
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel job');
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate(reason || undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Job
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel job <strong>{job?.jobNumber}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="cancelReason">Cancellation Reason (Optional)</Label>
          <Textarea
            id="cancelReason"
            placeholder="Enter reason for cancellation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')} disabled={cancelMutation.isPending}>
            No, Keep Job
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel Job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelJobDialog;