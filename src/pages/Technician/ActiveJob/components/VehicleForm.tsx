import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { technicianJobsService } from '@/api/services/technician-jobs.service';

const VehicleForm = ({ job }: { job: any }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleReg: job.vehicle?.vehicleReg || '',
    make: job.vehicle?.make || '',
    model: job.vehicle?.model || '',
    color: job.vehicle?.color || '',
    chassisNo: job.vehicle?.chassisNo || '',
    mileage: job.vehicle?.mileage || '',
    yearOfManufacture: job.vehicle?.yearOfManufacture || '',
    vehicleType: job.vehicle?.vehicleType || '',
  });

  const addVehicleMutation = useMutation({
    mutationFn: () =>
      technicianJobsService.addVehicleToJob(job.id, {
        vehicleReg: formData.vehicleReg,
        make: formData.make,
        model: formData.model,
        color: formData.color || undefined,
        chassisNo: formData.chassisNo,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        yearOfManufacture: formData.yearOfManufacture
          ? parseInt(formData.yearOfManufacture)
          : undefined,
        vehicleType: formData.vehicleType || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-job'] });
      toast.success('Vehicle information saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save vehicle information');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.vehicleReg ||
      !formData.make ||
      !formData.model ||
      !formData.chassisNo
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    addVehicleMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {job.vehicle ? 'Update Vehicle Information' : 'Add Vehicle Information'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleReg">
                Registration Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicleReg"
                placeholder="e.g., KCA 123A"
                value={formData.vehicleReg}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })
                }
                className="uppercase"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassisNo">
                Chassis Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="chassisNo"
                placeholder="e.g., JTMHV05J504012345"
                value={formData.chassisNo}
                onChange={(e) =>
                  setFormData({ ...formData, chassisNo: e.target.value.toUpperCase() })
                }
                className="uppercase font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="make">
                Make <span className="text-destructive">*</span>
              </Label>
              <Input
                id="make"
                placeholder="e.g., Toyota"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                placeholder="e.g., Land Cruiser"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., White"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                placeholder="e.g., SUV, Sedan, Truck"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="e.g., 45000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="yearOfManufacture"
                type="number"
                placeholder="e.g., 2020"
                value={formData.yearOfManufacture}
                onChange={(e) =>
                  setFormData({ ...formData, yearOfManufacture: e.target.value })
                }
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={addVehicleMutation.isPending}>
              {addVehicleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Vehicle Information
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleForm;
