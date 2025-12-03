import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, User, MapPin, Star, Edit, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { techniciansService, CreateTechnicianRequest, UpdateTechnicianRequest } from '@/api/services';

const SPECIALIZATIONS = [
  'GPS_TRACKER',
  'FUEL_MONITOR',
  'SPEED_GOVERNOR',
  'CAMERA',
  'ALARM',
  'IMMOBILIZER',
];

const LOCATIONS = ['NAIROBI', 'MOMBASA', 'KISUMU', 'ELDORET', 'NAKURU', 'NYERI', 'THIKA'];

const Technicians = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [deleteTechnician, setDeleteTechnician] = useState<any>(null);

  const [formData, setFormData] = useState<CreateTechnicianRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    specialization: [],
    location: '',
    isAvailable: true,
  });

  // Fetch technicians
  const { data: techniciansData, isLoading } = useQuery({
    queryKey: ['technicians', page, searchTerm],
    queryFn: () =>
      techniciansService.getTechnicians({
        page,
        limit: 10,
        search: searchTerm,
      }),
  });

  // Create technician mutation
  const createMutation = useMutation({
    mutationFn: techniciansService.createTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create technician');
    },
  });

  // Update technician mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTechnicianRequest }) =>
      techniciansService.updateTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTechnician(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update technician');
    },
  });

  // Delete technician mutation
  const deleteMutation = useMutation({
    mutationFn: techniciansService.deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician deleted successfully');
      setDeleteTechnician(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete technician');
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: techniciansService.toggleAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Availability status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      specialization: [],
      location: '',
      isAvailable: true,
    });
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  const handleAdd = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || formData.specialization.length === 0) {
      toast.error('Please fill all required fields and select at least one specialization');
      return;
    }

    if (!formData.email || !formData.username) {
      toast.error('Email and username are required');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedTechnician || !formData.firstName || !formData.lastName) {
      toast.error('Please fill all required fields');
      return;
    }

    updateMutation.mutate({
      id: selectedTechnician.id,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        specialization: formData.specialization,
        location: formData.location,
        isAvailable: formData.isAvailable,
      },
    });
  };

  const handleDelete = () => {
    if (deleteTechnician) {
      deleteMutation.mutate(deleteTechnician.id);
    }
  };

  const handleView = (technician: any) => {
    setSelectedTechnician(technician);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (technician: any) => {
    setSelectedTechnician(technician);
    setFormData({
      firstName: technician.user.firstName,
      lastName: technician.user.lastName,
      email: technician.user.email,
      phone: technician.user.phone,
      username: technician.user.username,
      specialization: technician.specialization,
      location: technician.location,
      isAvailable: technician.isAvailable,
    });
    setIsEditDialogOpen(true);
  };

  const toggleAvailability = (technician: any) => {
    toggleAvailabilityMutation.mutate(technician.id);
  };

  const getSpecializationBadge = (spec: string) => {
    const colors: Record<string, string> = {
      GPS_TRACKER: 'bg-blue-500',
      FUEL_MONITOR: 'bg-green-500',
      SPEED_GOVERNOR: 'bg-orange-500',
      CAMERA: 'bg-purple-500',
      ALARM: 'bg-red-500',
      IMMOBILIZER: 'bg-pink-500',
    };
    return (
      <Badge className={`${colors[spec]} text-white text-xs`}>
        {spec.replace('_', ' ')}
      </Badge>
    );
  };

  const technicians = techniciansData?.data || [];
  const totalTechnicians = techniciansData?.meta.total || 0;
  const availableCount = technicians.filter((t) => t.isAvailable).length;
  const onJobCount = technicians.filter((t) => !t.isAvailable).length;
  const avgRating = technicians.length > 0
    ? (technicians.reduce((sum, t) => sum + (t.rating || 0), 0) / technicians.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Technician Management</h1>
          <p className="text-muted-foreground">Manage field technicians and assignments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Technician
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Technicians</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTechnicians}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{onJobCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-1 fill-yellow-500" />
              {avgRating}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Technician Directory</CardTitle>
            <Input
              placeholder="Search technicians..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : technicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No technicians found.' : 'No technicians registered yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-mono">{tech.technicianCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tech.user.firstName} {tech.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{tech.user.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {tech.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tech.specialization.slice(0, 2).map((spec) => (
                            <span key={spec}>{getSpecializationBadge(spec)}</span>
                          ))}
                          {tech.specialization.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tech.specialization.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                          <span className="font-medium">{tech.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{tech.completedJobs || 0}</span>
                      </TableCell>
                      <TableCell>
                        {tech.isAvailable ? (
                          <Badge className="bg-green-500">Available</Badge>
                        ) : (
                          <Badge className="bg-orange-500">On Job</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(tech)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(tech)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteTechnician(tech)}
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

          {/* Pagination */}
          {techniciansData && techniciansData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {technicians.length} of {techniciansData.meta.total} technicians
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= techniciansData.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Technician</DialogTitle>
            <DialogDescription>Enter technician details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g., jamesmwangi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254712345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.location} onValueChange={(val) => setFormData({ ...formData, location: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>
                Specialization <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                {SPECIALIZATIONS.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={formData.specialization.includes(spec)}
                      onCheckedChange={() => handleSpecializationToggle(spec)}
                    />
                    <label htmlFor={`spec-${spec}`} className="text-sm cursor-pointer">
                      {spec.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
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
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
            <DialogDescription>Update technician information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Select value={formData.location} onValueChange={(val) => setFormData({ ...formData, location: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Specialization</Label>
              <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                {SPECIALIZATIONS.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-spec-${spec}`}
                      checked={formData.specialization.includes(spec)}
                      onCheckedChange={() => handleSpecializationToggle(spec)}
                    />
                    <label htmlFor={`edit-spec-${spec}`} className="text-sm cursor-pointer">
                      {spec.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedTechnician(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Technician Details</DialogTitle>
          </DialogHeader>
          {selectedTechnician && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="text-muted-foreground">Technician Code</Label>
                <p className="font-mono font-medium">{selectedTechnician.technicianCode}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">
                  {selectedTechnician.user.firstName} {selectedTechnician.user.lastName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{selectedTechnician.user.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedTechnician.user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-medium">{selectedTechnician.location}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Rating</Label>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-1 fill-yellow-500" />
                  <span className="font-medium text-lg">{selectedTechnician.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completed Jobs</Label>
                <p className="font-medium text-lg">{selectedTechnician.completedJobs || 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div>
                  {selectedTechnician.isAvailable ? (
                    <Badge className="bg-green-500">Available</Badge>
                  ) : (
                    <Badge className="bg-orange-500">On Job</Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Specializations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTechnician.specialization.map((spec) => (
                    <span key={spec}>{getSpecializationBadge(spec)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => toggleAvailability(selectedTechnician)}
              disabled={toggleAvailabilityMutation.isPending}
            >
              {selectedTechnician?.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditClick(selectedTechnician);
              }}
            >
              Edit Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTechnician} onOpenChange={() => setDeleteTechnician(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Technician</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete technician "{deleteTechnician?.user?.firstName} {deleteTechnician?.user?.lastName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Technicians;