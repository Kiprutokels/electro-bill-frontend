import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, User, Users, Phone, Mail, Star, AlertCircle } from 'lucide-react';
import { Job, JobStatus } from '@/api/services/jobs.service';
import { Alert, AlertDescription } from '../ui/alert';

interface ViewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onManageTechnicians: () => void;
  onCancel: () => void;
}

const ViewJobDialog = ({ open, onOpenChange, job, onManageTechnicians, onCancel }: ViewJobDialogProps) => {
  if (!job) return null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-500',
      ASSIGNED: 'bg-blue-500',
      IN_PROGRESS: 'bg-purple-500',
      COMPLETED: 'bg-green-500',
      VERIFIED: 'bg-green-600',
      CANCELLED: 'bg-red-500',
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-500'} text-white`}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      NEW_INSTALLATION: 'bg-blue-100 text-blue-800',
      REPLACEMENT: 'bg-orange-100 text-orange-800',
      MAINTENANCE: 'bg-green-100 text-green-800',
      REPAIR: 'bg-red-100 text-red-800',
      UPGRADE: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const canManageTechnicians = ![JobStatus.COMPLETED, JobStatus.VERIFIED, JobStatus.CANCELLED].includes(job.status);
  const canCancel = ![JobStatus.COMPLETED, JobStatus.VERIFIED, JobStatus.CANCELLED].includes(job.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Job Details</span>
            <div className="flex gap-2">
              {getStatusBadge(job.status)}
              {getJobTypeBadge(job.jobType)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Job Number</Label>
              <p className="font-mono font-semibold text-lg">{job.jobNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Scheduled Date</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(job.scheduledDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Customer Information</Label>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="font-medium">{job.customer.businessName || job.customer.contactPerson}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Customer Code</Label>
                <p className="font-mono text-sm">{job.customer.customerCode}</p>
              </div>
              {job.customer.phone && (
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {job.customer.phone}
                  </p>
                </div>
              )}
              {job.customer.email && (
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    {job.customer.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {job.vehicle ? (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Vehicle Information</Label>
              <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <Label className="text-muted-foreground text-xs">Registration</Label>
                  <p className="font-semibold">{job.vehicle.vehicleReg}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Make & Model</Label>
                  <p className="font-medium">{job.vehicle.make} {job.vehicle.model}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Color</Label>
                  <p>{job.vehicle.color || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No vehicle assigned yet</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Assigned Technicians */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Technicians ({job.technicians?.length || 0})
              </Label>
              {canManageTechnicians && (
                <Button size="sm" variant="outline" onClick={onManageTechnicians}>
                  Manage Team
                </Button>
              )}
            </div>

            {job.technicians && job.technicians.length > 0 ? (
              <div className="space-y-2">
                {job.technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className={`p-3 rounded-lg border ${
                      tech.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {tech.firstName} {tech.lastName}
                            </p>
                            {tech.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{tech.technicianCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm flex items-center gap-1 justify-end">
                          <MapPin className="h-3 w-3" />
                          {tech.location}
                        </p>
                        <p className="text-xs text-muted-foreground">{tech.phone}</p>
                      </div>
                    </div>
                    {tech.notes && (
                      <p className="text-xs text-muted-foreground mt-2 pl-13">
                        Note: {tech.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No technicians assigned yet</p>
                {job.status === JobStatus.PENDING && (
                  <Button size="sm" className="mt-2" onClick={onManageTechnicians}>
                    Assign Technicians
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Service Description */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Service Description</Label>
            <p className="text-sm bg-muted/50 p-4 rounded-lg">{job.serviceDescription}</p>
          </div>

          {/* Installation Notes */}
          {job.installationNotes && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Installation Notes</Label>
              <p className="text-sm bg-muted/50 p-4 rounded-lg">{job.installationNotes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <Label className="text-xs">Created</Label>
              <p>{new Date(job.createdAt).toLocaleString()}</p>
            </div>
            {job.startTime && (
              <div>
                <Label className="text-xs">Started</Label>
                <p>{new Date(job.startTime).toLocaleString()}</p>
              </div>
            )}
            {job.endTime && (
              <div>
                <Label className="text-xs">Completed</Label>
                <p>{new Date(job.endTime).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {canCancel && (
            <Button variant="destructive" onClick={onCancel}>
              Cancel Job
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewJobDialog;
