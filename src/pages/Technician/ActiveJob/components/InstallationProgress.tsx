import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { technicianJobsService } from '@/api/services/technician-jobs.service';

interface InstallationProgressProps {
  job: any;
  onComplete?: () => void;
}

const InstallationProgress = ({ job, onComplete }: InstallationProgressProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    imeiNumbers: job.imeiNumbers?.join(', ') || '',
    simCardIccid: job.simCardIccid || '',
    macAddress: job.macAddress || '',
    gpsCoordinates: job.gpsCoordinates || '',
    installationNotes: job.installationNotes || '',
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>(job.photoUrls || []);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return technicianJobsService.updateJobProgress(job.id, {
        imeiNumbers: formData.imeiNumbers
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
        simCardIccid: formData.simCardIccid || undefined,
        macAddress: formData.macAddress || undefined,
        gpsCoordinates: formData.gpsCoordinates || undefined,
        installationNotes: formData.installationNotes || undefined,
        photoUrls: photoUrls,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['active-job'] });
      await queryClient.invalidateQueries({ queryKey: ['job-by-id', job.id] });
      toast.success('Installation progress saved successfully');
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update progress');
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setFormData({ ...formData, gpsCoordinates: coords });
          toast.success('Location captured');
        },
        () => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  const handleSave = () => {
    if (photoUrls.length === 0) {
      toast.error('Please upload at least one installation photo');
      return;
    }

    const imeiList = formData.imeiNumbers.split(',').map(s => s.trim()).filter(s => s);
    if (imeiList.length === 0) {
      toast.error('Please enter at least one IMEI number');
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Installation Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-lg md:text-xl">Installation Details</CardTitle>
            <Badge className="bg-purple-500 w-fit">In Progress</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imeiNumbers" className="text-sm">
                IMEI Numbers <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs ml-2">(comma separated)</span>
              </Label>
              <Input
                id="imeiNumbers"
                placeholder="e.g., 123456789012345, 987654321098765"
                value={formData.imeiNumbers}
                onChange={(e) =>
                  setFormData({ ...formData, imeiNumbers: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simCardIccid" className="text-sm">
                SIM Card ICCID <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="simCardIccid"
                placeholder="e.g., 89254020001234567890"
                value={formData.simCardIccid}
                onChange={(e) =>
                  setFormData({ ...formData, simCardIccid: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="macAddress" className="text-sm">
                MAC Address <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="macAddress"
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
                value={formData.macAddress}
                onChange={(e) =>
                  setFormData({ ...formData, macAddress: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpsCoordinates" className="text-sm">GPS Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  id="gpsCoordinates"
                  placeholder="Latitude, Longitude"
                  value={formData.gpsCoordinates}
                  onChange={(e) =>
                    setFormData({ ...formData, gpsCoordinates: e.target.value })
                  }
                  readOnly
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="flex-shrink-0"
                >
                  <MapPin className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Capture</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installationNotes" className="text-sm">Installation Notes</Label>
            <Textarea
              id="installationNotes"
              placeholder="Add detailed installation notes, challenges faced, etc..."
              value={formData.installationNotes}
              onChange={(e) =>
                setFormData({ ...formData, installationNotes: e.target.value })
              }
              rows={4}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Installation Photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload photos of the completed installation
          </p>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={photoUrls}
            onChange={setPhotoUrls}
            maxFiles={10}
            accept="image/*"
            label="Photos"
            required
          />
        </CardContent>
      </Card>

      {/* Save Progress */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
          className="w-full sm:w-auto"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstallationProgress;
