import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';

const JobInfo = ({ job }: { job: any }) => {
  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Business Name</Label>
            <p className="font-medium">
              {job.customer.businessName || job.customer.contactPerson}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Contact Person</Label>
            <p className="font-medium">{job.customer.contactPerson || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Phone Number</Label>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <a href={`tel:${job.customer.phone}`} className="font-medium text-blue-600">
                {job.customer.phone}
              </a>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <a
                href={`mailto:${job.customer.email}`}
                className="font-medium text-blue-600"
              >
                {job.customer.email || 'N/A'}
              </a>
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground">Location</Label>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="font-medium">
                {job.customer.addressLine1 || 'N/A'}, {job.customer.city || ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          {job.vehicle ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Registration Number</Label>
                <p className="font-bold text-lg">{job.vehicle.vehicleReg}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Make & Model</Label>
                <p className="font-medium">
                  {job.vehicle.make} {job.vehicle.model}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Color</Label>
                <p className="font-medium">{job.vehicle.color || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Chassis Number</Label>
                <p className="font-mono text-sm">{job.vehicle.chassisNo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Mileage</Label>
                <p className="font-medium">
                  {job.vehicle.mileage ? `${job.vehicle.mileage} km` : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">ICCID SIM Card</Label>
                <p className="font-mono text-sm">
                  {job.vehicle.iccidSimcard || 'Not Assigned'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No vehicle assigned yet. You can add vehicle details in the Vehicle tab.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Job Type</Label>
              <Badge variant="outline" className="mt-1">
                {job.jobType.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Scheduled Date</Label>
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">
                  {new Date(job.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-muted-foreground">Service Description</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm">{job.serviceDescription}</p>
            </div>
          </div>

          {job.installationNotes && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Installation Notes</Label>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">{job.installationNotes}</p>
                </div>
              </div>
            </>
          )}

          {job.startTime && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Time</Label>
                  <p className="font-medium">
                    {new Date(job.startTime).toLocaleString()}
                  </p>
                </div>
                {job.endTime && (
                  <div>
                    <Label className="text-muted-foreground">End Time</Label>
                    <p className="font-medium">
                      {new Date(job.endTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobInfo;
