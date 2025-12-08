import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { CheckCircle, XCircle, Camera, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  inspectionsService,
  ChecklistCategory,
  CreateChecklistItemRequest,
} from '@/api/services';

const CATEGORIES = Object.values(ChecklistCategory);

const InspectionChecklist = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const [formData, setFormData] = useState<CreateChecklistItemRequest>({
    name: '',
    description: '',
    category: ChecklistCategory.DEVICE_COMPONENT,
    componentType: '',
    vehicleType: '',
    isPreInstallation: true,
    isPostInstallation: true,
    requiresPhoto: false,
    displayOrder: 0,
  });

  // Fetch checklist items
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['checklist-items', page, searchTerm],
    queryFn: () =>
      inspectionsService.getChecklistItems({
        page,
        limit: 20,
        search: searchTerm,
      }),
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['inspection-statistics'],
    queryFn: inspectionsService.getStatistics,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: inspectionsService.createChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Checklist item created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateChecklistItemRequest> }) =>
      inspectionsService.updateChecklistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Checklist item updated successfully');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: inspectionsService.deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Checklist item deleted successfully');
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: inspectionsService.toggleChecklistItemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Item status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: ChecklistCategory.DEVICE_COMPONENT,
      componentType: '',
      vehicleType: '',
      isPreInstallation: true,
      isPostInstallation: true,
      requiresPhoto: false,
      displayOrder: 0,
    });
  };

  const handleAdd = () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedItem || !formData.name) {
      toast.error('Please fill all required fields');
      return;
    }

    updateMutation.mutate({
      id: selectedItem.id,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem.id);
    }
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      componentType: item.componentType || '',
      vehicleType: item.vehicleType || '',
      isPreInstallation: item.isPreInstallation,
      isPostInstallation: item.isPostInstallation,
      requiresPhoto: item.requiresPhoto,
      displayOrder: item.displayOrder,
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      VEHICLE_EXTERIOR: 'bg-blue-100 text-blue-800',
      VEHICLE_INTERIOR: 'bg-green-100 text-green-800',
      VEHICLE_ENGINE: 'bg-orange-100 text-orange-800',
      DEVICE_COMPONENT: 'bg-purple-100 text-purple-800',
      SAFETY_CHECK: 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={colors[category]}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  const items = itemsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inspection Checklists</h1>
        <p className="text-muted-foreground">Manage pre and post-installation inspection items</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalInspections || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Pre-Install</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics?.pendingPreInstallation || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Post-Install</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics?.pendingPostInstallation || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics?.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Master Checklist Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Master Checklist Items</CardTitle>
              <p className="text-sm text-muted-foreground">Configure items used in inspections</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search checklist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Photo Required</TableHead>
                  <TableHead className="text-center">Pre-Install</TableHead>
                  <TableHead className="text-center">Post-Install</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No items found.' : 'No checklist items created yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCategoryBadge(item.category)}</TableCell>
                      <TableCell className="text-center">
                        {item.requiresPhoto ? (
                          <Badge className="bg-blue-500">
                            <Camera className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isPreInstallation ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isPostInstallation ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate(item.id)}
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteItem(item)}
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
          {itemsData && itemsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {items.length} of {itemsData.meta.total} items
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
                  disabled={page >= itemsData.meta.totalPages}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
            <DialogDescription>Create a new inspection checklist item</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                placeholder="e.g., GPS Tracker Status"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as ChecklistCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires-photo"
                  checked={formData.requiresPhoto}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresPhoto: checked as boolean })
                  }
                />
                <label htmlFor="requires-photo" className="text-sm cursor-pointer">
                  Requires Photo Evidence
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pre-installation"
                  checked={formData.isPreInstallation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPreInstallation: checked as boolean })
                  }
                />
                <label htmlFor="pre-installation" className="text-sm cursor-pointer">
                  Include in Pre-Installation Inspection
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-installation"
                  checked={formData.isPostInstallation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPostInstallation: checked as boolean })
                  }
                />
                <label htmlFor="post-installation" className="text-sm cursor-pointer">
                  Include in Post-Installation Inspection
                </label>
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
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
            <DialogDescription>Update inspection checklist item</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as ChecklistCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-displayOrder">Display Order</Label>
                <Input
                  id="edit-displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-requires-photo"
                  checked={formData.requiresPhoto}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresPhoto: checked as boolean })
                  }
                />
                <label htmlFor="edit-requires-photo" className="text-sm cursor-pointer">
                  Requires Photo Evidence
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-pre-installation"
                  checked={formData.isPreInstallation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPreInstallation: checked as boolean })
                  }
                />
                <label htmlFor="edit-pre-installation" className="text-sm cursor-pointer">
                  Include in Pre-Installation Inspection
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-post-installation"
                  checked={formData.isPostInstallation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPostInstallation: checked as boolean })
                  }
                />
                <label htmlFor="edit-post-installation" className="text-sm cursor-pointer">
                  Include in Post-Installation Inspection
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
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

export default InspectionChecklist;