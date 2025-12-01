import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Search, Car, Edit, Eye, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

// Vehicle Type
interface Vehicle {
  id: string;
  vehicleReg: string;
  customerId: string;
  customerName: string;
  make: string;
  model: string;
  color: string;
  chassisNo: string;
  mileage: number;
  iccidSimcard: string | null;
  yearOfManufacture: number;
  vehicleType: string;
  isActive: boolean;
}

// Initial Dummy Data
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    vehicleReg: 'KCA 123A',
    customerId: 'cust-1',
    customerName: 'Safaricom Ltd',
    make: 'Toyota',
    model: 'Land Cruiser',
    color: 'White',
    chassisNo: 'JTMHV05J504012345',
    mileage: 45000,
    iccidSimcard: '89254020000000123456',
    yearOfManufacture: 2020,
    vehicleType: 'SUV',
    isActive: true,
  },
  {
    id: '2',
    vehicleReg: 'KBZ 456B',
    customerId: 'cust-2',
    customerName: 'East African Breweries',
    make: 'Mercedes',
    model: 'Actros',
    color: 'Blue',
    chassisNo: 'WDB9346061L876543',
    mileage: 120000,
    iccidSimcard: '89254020000000789012',
    yearOfManufacture: 2018,
    vehicleType: 'TRUCK',
    isActive: true,
  },
  {
    id: '3',
    vehicleReg: 'KCD 789C',
    customerId: 'cust-3',
    customerName: 'Nairobi Water',
    make: 'Isuzu',
    model: 'NQR',
    color: 'Yellow',
    chassisNo: 'JALC4B16007123456',
    mileage: 78000,
    iccidSimcard: null,
    yearOfManufacture: 2019,
    vehicleType: 'TRUCK',
    isActive: false,
  },
];

// Dummy Customers
const DUMMY_CUSTOMERS = [
  { id: 'cust-1', name: 'Safaricom Ltd' },
  { id: 'cust-2', name: 'East African Breweries' },
  { id: 'cust-3', name: 'Nairobi Water' },
  { id: 'cust-4', name: 'Kenya Airways' },
];

const VEHICLE_TYPES = ['SEDAN', 'SUV', 'TRUCK', 'VAN', 'PICKUP', 'BUS', 'MOTORCYCLE'];

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    vehicleReg: '',
    customerId: '',
    make: '',
    model: '',
    color: '',
    chassisNo: '',
    mileage: '',
    iccidSimcard: '',
    yearOfManufacture: '',
    vehicleType: '',
  });

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.chassisNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      vehicleReg: '',
      customerId: '',
      make: '',
      model: '',
      color: '',
      chassisNo: '',
      mileage: '',
      iccidSimcard: '',
      yearOfManufacture: '',
      vehicleType: '',
    });
  };

  // Handle Add
  const handleAdd = () => {
    if (!formData.vehicleReg || !formData.customerId || !formData.chassisNo) {
      toast.error('Please fill required fields');
      return;
    }

    const customer = DUMMY_CUSTOMERS.find((c) => c.id === formData.customerId);
    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      vehicleReg: formData.vehicleReg,
      customerId: formData.customerId,
      customerName: customer?.name || '',
      make: formData.make,
      model: formData.model,
      color: formData.color,
      chassisNo: formData.chassisNo,
      mileage: parseInt(formData.mileage) || 0,
      iccidSimcard: formData.iccidSimcard || null,
      yearOfManufacture: parseInt(formData.yearOfManufacture) || new Date().getFullYear(),
      vehicleType: formData.vehicleType,
      isActive: true,
    };

    setVehicles([...vehicles, newVehicle]);
    toast.success('Vehicle registered successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Handle Edit
  const handleEdit = () => {
    if (!selectedVehicle || !formData.vehicleReg || !formData.customerId) {
      toast.error('Please fill required fields');
      return;
    }

    const customer = DUMMY_CUSTOMERS.find((c) => c.id === formData.customerId);
    const updatedVehicles = vehicles.map((v) =>
      v.id === selectedVehicle.id
        ? {
            ...v,
            vehicleReg: formData.vehicleReg,
            customerId: formData.customerId,
            customerName: customer?.name || '',
            make: formData.make,
            model: formData.model,
            color: formData.color,
            chassisNo: formData.chassisNo,
            mileage: parseInt(formData.mileage) || 0,
            iccidSimcard: formData.iccidSimcard || null,
            yearOfManufacture: parseInt(formData.yearOfManufacture) || new Date().getFullYear(),
            vehicleType: formData.vehicleType,
          }
        : v
    );

    setVehicles(updatedVehicles);
    toast.success('Vehicle updated successfully');
    setIsEditDialogOpen(false);
    setSelectedVehicle(null);
    resetForm();
  };

  // Handle Delete
  const handleDelete = () => {
    if (!deleteVehicle) return;
    setVehicles(vehicles.filter((v) => v.id !== deleteVehicle.id));
    toast.success('Vehicle deleted successfully');
    setDeleteVehicle(null);
  };

  // Handle View
  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewDialogOpen(true);
  };

  // Handle Edit Click
  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleReg: vehicle.vehicleReg,
      customerId: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      chassisNo: vehicle.chassisNo,
      mileage: vehicle.mileage.toString(),
      iccidSimcard: vehicle.iccidSimcard || '',
      yearOfManufacture: vehicle.yearOfManufacture.toString(),
      vehicleType: vehicle.vehicleType,
    });
    setIsEditDialogOpen(true);
  };

  // Toggle Status
  const toggleStatus = (vehicle: Vehicle) => {
    const updatedVehicles = vehicles.map((v) =>
      v.id === vehicle.id ? { ...v, isActive: !v.isActive } : v
    );
    setVehicles(updatedVehicles);
    toast.success(`Vehicle ${vehicle.isActive ? 'deactivated' : 'activated'} successfully`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Management</h1>
          <p className="text-muted-foreground">Manage customer vehicles and tracking devices</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Trackers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter((v) => v.iccidSimcard && v.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vehicles.filter((v) => !v.iccidSimcard).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {vehicles.filter((v) => !v.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Registry</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Make/Model</TableHead>
                  <TableHead>Chassis No</TableHead>
                  <TableHead>ICCID/Simcard</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles registered yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.vehicleReg}</TableCell>
                      <TableCell>
                        <div className="font-medium">{vehicle.customerName}</div>
                      </TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model}
                        <div className="text-sm text-muted-foreground">
                          {vehicle.color} • {vehicle.yearOfManufacture}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{vehicle.chassisNo}</TableCell>
                      <TableCell>
                        {vehicle.iccidSimcard ? (
                          <span className="font-mono text-sm">{vehicle.iccidSimcard}</span>
                        ) : (
                          <Badge variant="outline">Not Assigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehicle.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(vehicle)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(vehicle)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteVehicle(vehicle)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Vehicle</DialogTitle>
            <DialogDescription>Enter vehicle details to register in the system</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleReg">
                Vehicle Reg <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicleReg"
                placeholder="KCA 123A"
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.customerId} onValueChange={(val) => setFormData({ ...formData, customerId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CUSTOMERS.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="Toyota"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Land Cruiser"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="White"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chassisNo">
                Chassis No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="chassisNo"
                placeholder="JTMHV05J504012345"
                value={formData.chassisNo}
                onChange={(e) => setFormData({ ...formData, chassisNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="45000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iccidSimcard">ICCID/Simcard</Label>
              <Input
                id="iccidSimcard"
                placeholder="89254020000000123456"
                value={formData.iccidSimcard}
                onChange={(e) => setFormData({ ...formData, iccidSimcard: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="yearOfManufacture"
                type="number"
                placeholder="2020"
                value={formData.yearOfManufacture}
                onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={formData.vehicleType} onValueChange={(val) => setFormData({ ...formData, vehicleType: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Register Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Same form fields as Add Dialog */}
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleReg">
                Vehicle Reg <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-vehicleReg"
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.customerId} onValueChange={(val) => setFormData({ ...formData, customerId: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CUSTOMERS.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-make">Make</Label>
              <Input
                id="edit-make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chassisNo">
                Chassis No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-chassisNo"
                value={formData.chassisNo}
                onChange={(e) => setFormData({ ...formData, chassisNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mileage">Mileage (km)</Label>
              <Input
                id="edit-mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-iccidSimcard">ICCID/Simcard</Label>
              <Input
                id="edit-iccidSimcard"
                value={formData.iccidSimcard}
                onChange={(e) => setFormData({ ...formData, iccidSimcard: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="edit-yearOfManufacture"
                type="number"
                value={formData.yearOfManufacture}
                onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleType">Vehicle Type</Label>
              <Select value={formData.vehicleType} onValueChange={(val) => setFormData({ ...formData, vehicleType: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedVehicle(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Vehicle Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Vehicle Registration</Label>
                <p className="font-medium">{selectedVehicle.vehicleReg}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <p className="font-medium">{selectedVehicle.customerName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Make/Model</Label>
                <p className="font-medium">
                  {selectedVehicle.make} {selectedVehicle.model}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Color</Label>
                <p className="font-medium">{selectedVehicle.color}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Chassis No</Label>
                <p className="font-mono text-sm">{selectedVehicle.chassisNo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Mileage</Label>
                <p className="font-medium">{selectedVehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <Label className="text-muted-foreground">ICCID/Simcard</Label>
                <p className="font-mono text-sm">{selectedVehicle.iccidSimcard || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Year of Manufacture</Label>
                <p className="font-medium">{selectedVehicle.yearOfManufacture}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vehicle Type</Label>
                <p className="font-medium">{selectedVehicle.vehicleType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div>
                  {selectedVehicle.isActive ? (
                    <Badge className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => toggleStatus(selectedVehicle!)}>
              {selectedVehicle?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditClick(selectedVehicle!);
              }}
            >
              Edit Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={() => setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle "{deleteVehicle?.vehicleReg}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
