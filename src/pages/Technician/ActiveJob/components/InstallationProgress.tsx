import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, MapPin, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { technicianJobsService } from '@/api/services/technician-jobs.service';

const InstallationProgress = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    devicePosition: job.devicePosition || '',
    imeiNumbers: job.imeiNumbers?.join(', ') || '',
    gpsCoordinates: job.gpsCoordinates || '',
    installationNotes: job.installationNotes || '',
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(
    job.photoUrls || []
  );

  const updateMutation = useMutation({
    mutationFn: async () => {
      // TODO: Upload photos to storage service
      const uploadedUrls = photoPreviews;

      return technicianJobsService.updateJobProgress(job.id, {
        devicePosition: formData.devicePosition,
        imeiNumbers: formData.imeiNumbers
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
        gpsCoordinates: formData.gpsCoordinates,
        installationNotes: formData.installationNotes,
        photoUrls: uploadedUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-job'] });
      toast.success('Installation progress updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update progress');
    },
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles([...photoFiles, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...previews]);
  };

  const handleRemovePhoto = (index: number) => {
    const newFiles = photoFiles.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

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
    if (!formData.devicePosition) {
      toast.error('Please enter device position');
      return;
    }

    if (photoPreviews.length === 0) {
      toast.error('Please upload at least one installation photo');
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Installation Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Installation Details</CardTitle>
            <Badge className="bg-purple-500">
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="devicePosition">
                Device Config<span className="text-destructive">*</span>
              </Label>
              <Input
                id="devicePosition"
                placeholder="e.g., Dashboard center console"
                value={formData.devicePosition}
                onChange={(e) =>
                  setFormData({ ...formData, devicePosition: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imeiNumbers">
                IMEI Numbers <span className="text-muted-foreground">(comma separated)</span>
              </Label>
              <Input
                id="imeiNumbers"
                placeholder="e.g., 123456789012345, 987654321098765"
                value={formData.imeiNumbers}
                onChange={(e) =>
                  setFormData({ ...formData, imeiNumbers: e.target.value })
                }
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpsCoordinates">GPS Coordinates</Label>
            <div className="flex gap-2">
              <Input
                id="gpsCoordinates"
                placeholder="Latitude, Longitude"
                value={formData.gpsCoordinates}
                onChange={(e) =>
                  setFormData({ ...formData, gpsCoordinates: e.target.value })
                }
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installationNotes">Installation Notes</Label>
            <Textarea
              id="installationNotes"
              placeholder="Add detailed installation notes, challenges faced, etc..."
              value={formData.installationNotes}
              onChange={(e) =>
                setFormData({ ...formData, installationNotes: e.target.value })
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload photos of the completed installation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photos">
              Photos <span className="text-destructive">*</span>
            </Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoCapture}
            />
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Installation photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Progress */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Progress
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstallationProgress;
