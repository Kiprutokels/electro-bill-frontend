import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { technicianJobsService } from '@/api/services/technician-jobs.service';

const CompletionForm = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmationChecks, setConfirmationChecks] = useState({
    allComponentsWorking: false,
    customerTrained: false,
    documentationProvided: false,
    areaCleanedUp: false,
  });
  const [completionNotes, setCompletionNotes] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');

  const completeMutation = useMutation({
    mutationFn: () =>
      technicianJobsService.completeJob(job.id, {
        devicePosition: job.devicePosition,
        photoUrls: job.photoUrls || [],
        imeiNumbers: job.imeiNumbers || [],
        gpsCoordinates: job.gpsCoordinates,
        installationNotes: completionNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-job'] });
      queryClient.invalidateQueries({ queryKey: ['technician-jobs'] });
      toast.success('Job completed successfully!');
      navigate('/technician/jobs');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete job');
    },
  });

  const allChecksCompleted = Object.values(confirmationChecks).every(Boolean);

  const handleComplete = () => {
    if (!allChecksCompleted) {
      toast.error('Please complete all confirmation checks');
      return;
    }

    if (!customerSignature) {
      toast.error('Customer signature is required');
      return;
    }

    if (!completionNotes) {
      toast.error('Please add completion notes');
      return;
    }

    completeMutation.mutate();
  };

  // Check if all prerequisites are met
  const hasVehicle = !!job.vehicleId;
  const hasPreInspection = job.status !== 'ASSIGNED';
  const hasInstallationData = job.devicePosition && job.photoUrls?.length > 0;
  const hasPostInspection = job.status === 'POST_INSPECTION_PENDING' || job.status === 'COMPLETED';

  const canComplete = hasVehicle && hasPreInspection && hasInstallationData && hasPostInspection;

  return (
    <div className="space-y-6">
      {/* Prerequisites Check */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {hasVehicle ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span className={hasVehicle ? 'text-green-800' : 'text-orange-800'}>
                Vehicle information added
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasPreInspection ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span className={hasPreInspection ? 'text-green-800' : 'text-orange-800'}>
                Pre-installation inspection completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasInstallationData ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span className={hasInstallationData ? 'text-green-800' : 'text-orange-800'}>
                Installation details and photos added
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasPostInspection ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <span className={hasPostInspection ? 'text-green-800' : 'text-orange-800'}>
                Post-installation inspection completed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Checklist</CardTitle>
          <p className="text-sm text-muted-foreground">
            Confirm all items before completing the job
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="allComponentsWorking"
                checked={confirmationChecks.allComponentsWorking}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    allComponentsWorking: checked as boolean,
                  })
                }
              />
              <Label htmlFor="allComponentsWorking" className="font-medium cursor-pointer">
                All components are working correctly
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="customerTrained"
                checked={confirmationChecks.customerTrained}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    customerTrained: checked as boolean,
                  })
                }
              />
              <Label htmlFor="customerTrained" className="font-medium cursor-pointer">
                Customer has been trained on system usage
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="documentationProvided"
                checked={confirmationChecks.documentationProvided}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    documentationProvided: checked as boolean,
                  })
                }
              />
              <Label htmlFor="documentationProvided" className="font-medium cursor-pointer">
                Documentation and warranty information provided
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="areaCleanedUp"
                checked={confirmationChecks.areaCleanedUp}
                onCheckedChange={(checked) =>
                  setConfirmationChecks({
                    ...confirmationChecks,
                    areaCleanedUp: checked as boolean,
                  })
                }
              />
              <Label htmlFor="areaCleanedUp" className="font-medium cursor-pointer">
                Work area has been cleaned and materials removed
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completionNotes">
              Final Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completionNotes"
              placeholder="Add any final notes about the installation, customer feedback, or recommendations..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerSignature">
              Customer Name (Signature) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerSignature"
              placeholder="Customer full name"
              value={customerSignature}
              onChange={(e) => setCustomerSignature(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Please confirm customer name to acknowledge installation completion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Job Number</Label>
              <p className="font-mono font-medium">{job.jobNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">
                {job.customer.businessName || job.customer.contactPerson}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Vehicle</Label>
              <p className="font-medium">
                {job.vehicle?.vehicleReg || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Device Position</Label>
              <p className="font-medium">{job.devicePosition || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">IMEI Numbers</Label>
              <p className="font-mono text-xs">
                {job.imeiNumbers?.join(', ') || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Photos Uploaded</Label>
              <p className="font-medium">
                {job.photoUrls?.length || 0} photo(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canComplete || completeMutation.isPending}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Job...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Job
            </>
          )}
        </Button>
      </div>

      {!canComplete && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Cannot complete job yet
                </p>
                <p className="text-sm text-orange-700">
                  Please complete all prerequisites before finishing the job.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompletionForm;
