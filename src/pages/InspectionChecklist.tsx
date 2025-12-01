import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { CheckCircle, XCircle, AlertTriangle, Camera, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  requiresPhoto: boolean;
  isPreInstallation: boolean;
  isPostInstallation: boolean;
  displayOrder: number;
  isActive: boolean;
}

interface InspectionTransaction {
  id: string;
  jobId: string;
  jobNumber: string;
  vehicleReg: string;
  technicianName: string;
  inspectionStage: string;
  completedItems: number;
  totalItems: number;
  status: string;
  date: string;
  items: {
    checklistItemId: string;
    checklistItemName: string;
    status: string;
    notes: string;
    photoUrls: string[];
  }[];
}

const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Device Components (from your list)
  { id: '1', name: 'Ignition Starter Cut', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 1, isActive: true },
  { id: '2', name: 'Fuel Pump Cut', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 2, isActive: true },
  { id: '3', name: 'Bonnet Lock', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 3, isActive: true },
  { id: '4', name: 'Dashboard Lights', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 4, isActive: true },
  { id: '5', name: 'Brakes Lights', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 5, isActive: true },
  { id: '6', name: 'Reverse Lights', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 6, isActive: true },
  { id: '7', name: 'Horn', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 7, isActive: true },
  { id: '8', name: 'Immobilizer', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 8, isActive: true },
  { id: '9', name: 'Power Locking', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 9, isActive: true },
  { id: '10', name: 'Power Windows', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 10, isActive: true },
  { id: '11', name: 'Power Output', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 11, isActive: true },
  { id: '12', name: 'Glove Compartment', category: 'DEVICE_COMPONENT', requiresPhoto: false, isPreInstallation: true, isPostInstallation: true, displayOrder: 12, isActive: true },
  { id: '13', name: 'Wiring', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 13, isActive: true },
  { id: '14', name: 'Speed Governor', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 14, isActive: true },
  { id: '15', name: 'SIM Card', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: true, isPostInstallation: true, displayOrder: 15, isActive: true },
  { id: '16', name: 'Device Status', category: 'DEVICE_COMPONENT', requiresPhoto: true, isPreInstallation: false, isPostInstallation: true, displayOrder: 16, isActive: true },
  // Vehicle Inspection Items
  { id: '17', name: 'Exterior Body Condition', category: 'VEHICLE_EXTERIOR', requiresPhoto: true, isPreInstallation: true, isPostInstallation: false, displayOrder: 17, isActive: true },
  { id: '18', name: 'Battery Condition', category: 'VEHICLE_ENGINE', requiresPhoto: false, isPreInstallation: true, isPostInstallation: false, displayOrder: 18, isActive: true },
];

const INITIAL_INSPECTIONS: InspectionTransaction[] = [
  {
    id: '1',
    jobId: 'job-1',
    jobNumber: 'JOB-2025-045',
    vehicleReg: 'KCA 123A',
    technicianName: 'James Mwangi',
    inspectionStage: 'PRE_INSTALLATION',
    completedItems: 8,
    totalItems: 18,
    status: 'IN_PROGRESS',
    date: '2025-01-20',
    items: [],
  },
  {
    id: '2',
    jobId: 'job-2',
    jobNumber: 'JOB-2025-044',
    vehicleReg: 'KBZ 456B',
    technicianName: 'Grace Achieng',
    inspectionStage: 'POST_INSTALLATION',
    completedItems: 16,
    totalItems: 16,
    status: 'AWAITING_APPROVAL',
    date: '2025-01-18',
    items: [],
  },
];

const CATEGORIES = ['VEHICLE_EXTERIOR', 'VEHICLE_INTERIOR', 'VEHICLE_ENGINE', 'DEVICE_COMPONENT', 'SAFETY_CHECK'];

const InspectionChecklist = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [inspections, setInspections] = useState<InspectionTransaction[]>(INITIAL_INSPECTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isViewInspectionDialogOpen, setIsViewInspectionDialogOpen] = useState(false);
  const [isPerformInspectionDialogOpen, setIsPerformInspectionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionTransaction | null>(null);
  const [deleteItem, setDeleteItem] = useState<ChecklistItem | null>(null);

  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: '',
    requiresPhoto: false,
    isPreInstallation: true,
    isPostInstallation: true,
  });

  const [inspectionFormData, setInspectionFormData] = useState<Record<string, {
    status: string;
    notes: string;
  }>>({});

  const filteredChecklistItems = checklistItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      category: '',
      requiresPhoto: false,
      isPreInstallation: true,
      isPostInstallation: true,
    });
  };

  const handleAddItem = () => {
    if (!itemFormData.name || !itemFormData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      name: itemFormData.name,
      category: itemFormData.category,
      requiresPhoto: itemFormData.requiresPhoto,
      isPreInstallation: itemFormData.isPreInstallation,
      isPostInstallation: itemFormData.isPostInstallation,
      displayOrder: checklistItems.length + 1,
      isActive: true,
    };

    setChecklistItems([...checklistItems, newItem]);
    toast.success('Checklist item added successfully');
    setIsAddItemDialogOpen(false);
    resetItemForm();
  };

  const handleEditItem = () => {
    if (!selectedItem || !itemFormData.name) {
      toast.error('Please fill all required fields');
      return;
    }

    const updatedItems = checklistItems.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            name: itemFormData.name,
            category: itemFormData.category,
            requiresPhoto: itemFormData.requiresPhoto,
            isPreInstallation: itemFormData.isPreInstallation,
            isPostInstallation: itemFormData.isPostInstallation,
          }
        : item
    );

    setChecklistItems(updatedItems);
    toast.success('Checklist item updated successfully');
    setIsEditItemDialogOpen(false);
    setSelectedItem(null);
    resetItemForm();
  };

  const handleDeleteItem = () => {
    if (!deleteItem) return;
    setChecklistItems(checklistItems.filter((item) => item.id !== deleteItem.id));
    toast.success('Checklist item deleted successfully');
    setDeleteItem(null);
  };

  const handleEditClick = (item: ChecklistItem) => {
    setSelectedItem(item);
    setItemFormData({
      name: item.name,
      category: item.category,
      requiresPhoto: item.requiresPhoto,
      isPreInstallation: item.isPreInstallation,
      isPostInstallation: item.isPostInstallation,
    });
    setIsEditItemDialogOpen(true);
  };

  const toggleItemStatus = (item: ChecklistItem) => {
    const updatedItems = checklistItems.map((i) =>
      i.id === item.id ? { ...i, isActive: !i.isActive } : i
    );
    setChecklistItems(updatedItems);
    toast.success(`Checklist item ${item.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleApproveInspection = (inspection: InspectionTransaction) => {
    const updatedInspections = inspections.map((i) =>
      i.id === inspection.id ? { ...i, status: 'APPROVED' } : i
    );
    setInspections(updatedInspections);
    toast.success('Inspection approved successfully');
  };

  const handleRejectInspection = (inspection: InspectionTransaction) => {
    const updatedInspections = inspections.map((i) =>
      i.id === inspection.id ? { ...i, status: 'REJECTED' } : i
    );
    setInspections(updatedInspections);
    toast.success('Inspection rejected');
  };

  const handleViewInspection = (inspection: InspectionTransaction) => {
    setSelectedInspection(inspection);
    setIsViewInspectionDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      IN_PROGRESS: { color: 'bg-blue-500', icon: AlertTriangle, label: 'In Progress' },
      COMPLETED: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
      AWAITING_APPROVAL: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Awaiting Approval' },
      APPROVED: { color: 'bg-green-600', icon: CheckCircle, label: 'Approved' },
      REJECTED: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inspection Checklists</h1>
        <p className="text-muted-foreground">Manage pre and post-installation inspections</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inspections.filter((i) => i.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inspections.filter((i) => i.status === 'AWAITING_APPROVAL').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inspections.filter((i) => i.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Checklist Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Master Checklist Items</CardTitle>
              <p className="text-sm text-muted-foreground">Configure checklist items used in inspections</p>
            </div>
            <Button onClick={() => setIsAddItemDialogOpen(true)}>
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
          <div className="rounded-md border max-h-96 overflow-auto">
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
                {filteredChecklistItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No checklist items found.' : 'No checklist items created yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChecklistItems.map((item) => (
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
                            onClick={() => toggleItemStatus(item)}
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
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job/Vehicle</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">No inspections recorded yet.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono font-medium">{inspection.jobNumber}</div>
                          <div className="text-sm text-muted-foreground">{inspection.vehicleReg}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{inspection.technicianName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inspection.inspectionStage === 'PRE_INSTALLATION' ? 'default' : 'secondary'}>
                          {inspection.inspectionStage.replace('_', '-')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${(inspection.completedItems / inspection.totalItems) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {inspection.completedItems}/{inspection.totalItems}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{inspection.date}</TableCell>
                      <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewInspection(inspection)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {inspection.status === 'AWAITING_APPROVAL' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveInspection(inspection)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectInspection(inspection)}>
                                Reject
                              </Button>
                            </>
                          )}
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

      {/* Add Checklist Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
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
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={itemFormData.category}
                onValueChange={(val) => setItemFormData({ ...itemFormData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires-photo"
                  checked={itemFormData.requiresPhoto}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, requiresPhoto: checked as boolean })
                  }
                />
                <label htmlFor="requires-photo" className="text-sm cursor-pointer">
                  Requires Photo Evidence
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pre-installation"
                  checked={itemFormData.isPreInstallation}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, isPreInstallation: checked as boolean })
                  }
                />
                <label htmlFor="pre-installation" className="text-sm cursor-pointer">
                  Include in Pre-Installation Inspection
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-installation"
                  checked={itemFormData.isPostInstallation}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, isPostInstallation: checked as boolean })
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
                setIsAddItemDialogOpen(false);
                resetItemForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
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
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={itemFormData.category}
                onValueChange={(val) => setItemFormData({ ...itemFormData, category: val })}
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
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-requires-photo"
                  checked={itemFormData.requiresPhoto}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, requiresPhoto: checked as boolean })
                  }
                />
                <label htmlFor="edit-requires-photo" className="text-sm cursor-pointer">
                  Requires Photo Evidence
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-pre-installation"
                  checked={itemFormData.isPreInstallation}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, isPreInstallation: checked as boolean })
                  }
                />
                <label htmlFor="edit-pre-installation" className="text-sm cursor-pointer">
                  Include in Pre-Installation Inspection
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-post-installation"
                  checked={itemFormData.isPostInstallation}
                  onCheckedChange={(checked) =>
                    setItemFormData({ ...itemFormData, isPostInstallation: checked as boolean })
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
                setIsEditItemDialogOpen(false);
                setSelectedItem(null);
                resetItemForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Inspection Dialog */}
      <Dialog open={isViewInspectionDialogOpen} onOpenChange={setIsViewInspectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-mono font-medium text-lg">{selectedInspection.jobNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInspection.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{selectedInspection.vehicleReg}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">{selectedInspection.technicianName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Inspection Stage</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedInspection.inspectionStage === 'PRE_INSTALLATION' ? 'default' : 'secondary'}
                    >
                      {selectedInspection.inspectionStage.replace('_', '-')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedInspection.date}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Progress</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${(selectedInspection.completedItems / selectedInspection.totalItems) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-medium text-lg">
                    {selectedInspection.completedItems}/{selectedInspection.totalItems} items completed
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Inspection Items</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {selectedInspection.items.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No items recorded yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedInspection.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between border-b pb-2 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.checklistItemName}</p>
                            {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                          </div>
                          <Badge
                            className={
                              item.status === 'PASS'
                                ? 'bg-green-500'
                                : item.status === 'FAIL'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewInspectionDialogOpen(false)}>
              Close
            </Button>
            {selectedInspection?.status === 'AWAITING_APPROVAL' && (
              <>
                <Button onClick={() => handleApproveInspection(selectedInspection)}>Approve</Button>
                <Button variant="destructive" onClick={() => handleRejectInspection(selectedInspection)}>
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
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
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InspectionChecklist;