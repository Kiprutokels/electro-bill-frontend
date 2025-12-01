import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Package, CheckCircle, XCircle, Clock, Eye, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface RequisitionItem {
  productId: string;
  productName: string;
  quantityRequested: number;
  quantityIssued: number;
}

interface Requisition {
  id: string;
  requisitionNumber: string;
  jobId: string;
  jobNumber: string;
  vehicleReg: string;
  technicianId: string;
  technicianName: string;
  status: string;
  requestedDate: string;
  approvedDate: string | null;
  items: RequisitionItem[];
  notes: string;
  rejectionReason: string | null;
}

const INITIAL_REQUISITIONS: Requisition[] = [
  {
    id: '1',
    requisitionNumber: 'REQ-2025-001',
    jobId: 'job-1',
    jobNumber: 'JOB-2025-045',
    vehicleReg: 'KCA 123A',
    technicianId: 'tech-1',
    technicianName: 'James Mwangi',
    status: 'PENDING',
    requestedDate: '2025-01-15',
    approvedDate: null,
    items: [
      { productId: 'p1', productName: 'GPS Tracker GT06N', quantityRequested: 1, quantityIssued: 0 },
      { productId: 'p2', productName: 'SIM Card', quantityRequested: 1, quantityIssued: 0 },
      { productId: 'p3', productName: 'Power Cable', quantityRequested: 1, quantityIssued: 0 },
    ],
    notes: 'Urgent installation for Safaricom fleet',
    rejectionReason: null,
  },
  {
    id: '2',
    requisitionNumber: 'REQ-2025-002',
    jobId: 'job-2',
    jobNumber: 'JOB-2025-043',
    vehicleReg: 'KBZ 456B',
    technicianId: 'tech-2',
    technicianName: 'Grace Achieng',
    status: 'APPROVED',
    requestedDate: '2025-01-14',
    approvedDate: '2025-01-14',
    items: [
      { productId: 'p1', productName: 'GPS Tracker GT06N', quantityRequested: 1, quantityIssued: 1 },
      { productId: 'p4', productName: 'Fuel Sensor', quantityRequested: 2, quantityIssued: 2 },
    ],
    notes: '',
    rejectionReason: null,
  },
  {
    id: '3',
    requisitionNumber: 'REQ-2025-003',
    jobId: 'job-3',
    jobNumber: 'JOB-2025-041',
    vehicleReg: 'KCD 789C',
    technicianId: 'tech-1',
    technicianName: 'James Mwangi',
    status: 'PARTIALLY_ISSUED',
    requestedDate: '2025-01-13',
    approvedDate: '2025-01-13',
    items: [
      { productId: 'p1', productName: 'GPS Tracker GT06N', quantityRequested: 2, quantityIssued: 1 },
      { productId: 'p2', productName: 'SIM Card', quantityRequested: 2, quantityIssued: 2 },
    ],
    notes: '',
    rejectionReason: null,
  },
];

const DUMMY_PRODUCTS = [
  { id: 'p1', name: 'GPS Tracker GT06N', stock: 50 },
  { id: 'p2', name: 'SIM Card', stock: 100 },
  { id: 'p3', name: 'Power Cable', stock: 75 },
  { id: 'p4', name: 'Fuel Sensor', stock: 30 },
  { id: 'p5', name: 'Speed Governor', stock: 20 },
  { id: 'p6', name: 'Camera Module', stock: 15 },
];

const DUMMY_JOBS = [
  { id: 'job-1', jobNumber: 'JOB-2025-045', vehicleReg: 'KCA 123A', technicianId: 'tech-1', technicianName: 'James Mwangi' },
  { id: 'job-2', jobNumber: 'JOB-2025-044', vehicleReg: 'KBZ 456B', technicianId: 'tech-2', technicianName: 'Grace Achieng' },
];

const Requisitions = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

  const [formData, setFormData] = useState({
    jobId: '',
    notes: '',
  });

  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);
  const [issueQuantities, setIssueQuantities] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequisitions = requisitions.filter(
    (r) =>
      r.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ jobId: '', notes: '' });
    setRequisitionItems([]);
  };

  const handleAddItem = () => {
    setRequisitionItems([
      ...requisitionItems,
      { productId: '', productName: '', quantityRequested: 1, quantityIssued: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setRequisitionItems(requisitionItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RequisitionItem, value: any) => {
    const updated = [...requisitionItems];
    if (field === 'productId') {
      const product = DUMMY_PRODUCTS.find((p) => p.id === value);
      updated[index].productId = value;
      updated[index].productName = product?.name || '';
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setRequisitionItems(updated);
  };

  const handleAdd = () => {
    if (!formData.jobId || requisitionItems.length === 0) {
      toast.error('Please select a job and add at least one item');
      return;
    }

    const hasInvalidItems = requisitionItems.some((item) => !item.productId || item.quantityRequested <= 0);
    if (hasInvalidItems) {
      toast.error('Please fill all item details correctly');
      return;
    }

    const job = DUMMY_JOBS.find((j) => j.id === formData.jobId);

    const newRequisition: Requisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: `REQ-${new Date().getFullYear()}-${String(requisitions.length + 1).padStart(3, '0')}`,
      jobId: formData.jobId,
      jobNumber: job?.jobNumber || '',
      vehicleReg: job?.vehicleReg || '',
      technicianId: job?.technicianId || '',
      technicianName: job?.technicianName || '',
      status: 'PENDING',
      requestedDate: new Date().toISOString().split('T')[0],
      approvedDate: null,
      items: requisitionItems,
      notes: formData.notes,
      rejectionReason: null,
    };

    setRequisitions([newRequisition, ...requisitions]);
    toast.success('Requisition created successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleApprove = (requisition: Requisition) => {
    const updatedRequisitions = requisitions.map((r) =>
      r.id === requisition.id
        ? {
            ...r,
            status: 'APPROVED',
            approvedDate: new Date().toISOString().split('T')[0],
          }
        : r
    );

    setRequisitions(updatedRequisitions);
    toast.success('Requisition approved successfully');
  };

  const handleReject = () => {
    if (!selectedRequisition || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const updatedRequisitions = requisitions.map((r) =>
      r.id === selectedRequisition.id
        ? {
            ...r,
            status: 'REJECTED',
            rejectionReason: rejectionReason,
          }
        : r
    );

    setRequisitions(updatedRequisitions);
    toast.success('Requisition rejected');
    setIsRejectDialogOpen(false);
    setSelectedRequisition(null);
    setRejectionReason('');
  };

  const handleIssueItems = () => {
    if (!selectedRequisition) return;

    const hasInvalidQuantities = Object.values(issueQuantities).some(
      (qty) => qty < 0 || !Number.isInteger(qty)
    );

    if (hasInvalidQuantities) {
      toast.error('Please enter valid quantities');
      return;
    }

    const updatedItems = selectedRequisition.items.map((item) => ({
      ...item,
      quantityIssued: item.quantityIssued + (issueQuantities[item.productId] || 0),
    }));

    const allFullyIssued = updatedItems.every((item) => item.quantityIssued >= item.quantityRequested);
    const someIssued = updatedItems.some((item) => item.quantityIssued > 0);

    const newStatus = allFullyIssued ? 'FULLY_ISSUED' : someIssued ? 'PARTIALLY_ISSUED' : 'APPROVED';

    const updatedRequisitions = requisitions.map((r) =>
      r.id === selectedRequisition.id
        ? {
            ...r,
            items: updatedItems,
            status: newStatus,
          }
        : r
    );

    setRequisitions(updatedRequisitions);
    toast.success('Items issued successfully');
    setIsIssueDialogOpen(false);
    setSelectedRequisition(null);
    setIssueQuantities({});
  };

  const handleView = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setIsViewDialogOpen(true);
  };

  const handleIssueClick = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    const initialQuantities: Record<string, number> = {};
    requisition.items.forEach((item) => {
      initialQuantities[item.productId] = Math.max(0, item.quantityRequested - item.quantityIssued);
    });
    setIssueQuantities(initialQuantities);
    setIsIssueDialogOpen(true);
  };

  const handleRejectClick = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-500', icon: Clock },
      APPROVED: { color: 'bg-blue-500', icon: CheckCircle },
      PARTIALLY_ISSUED: { color: 'bg-orange-500', icon: Package },
      FULLY_ISSUED: { color: 'bg-green-500', icon: CheckCircle },
      REJECTED: { color: 'bg-red-500', icon: XCircle },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Material Requisitions</h1>
          <p className="text-muted-foreground">Manage equipment requests and issuance</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Requisition
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requisitions.filter((r) => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requisitions.filter((r) => r.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partially Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {requisitions.filter((r) => r.status === 'PARTIALLY_ISSUED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fully Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requisitions.filter((r) => r.status === 'FULLY_ISSUED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Requisitions</CardTitle>
            <Input
              placeholder="Search requisitions..."
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
                  <TableHead>Req Number</TableHead>
                  <TableHead>Job/Vehicle</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No requisitions found.' : 'No requisitions created yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-medium">{req.requisitionNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{req.jobNumber}</div>
                          <div className="text-sm text-muted-foreground">{req.vehicleReg}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{req.technicianName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {req.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-muted-foreground ml-2">
                                ({item.quantityIssued}/{item.quantityRequested})
                              </span>
                            </div>
                          ))}
                          {req.items.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{req.items.length - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{req.requestedDate}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(req)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {req.status === 'PENDING' && (
                            <>
                              <Button size="sm" onClick={() => handleApprove(req)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectClick(req)}>
                                Reject
                              </Button>
                            </>
                          )}
                          {(req.status === 'APPROVED' || req.status === 'PARTIALLY_ISSUED') && (
                            <Button size="sm" onClick={() => handleIssueClick(req)}>
                              Issue Items
                            </Button>
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

      {/* Add Requisition Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Requisition</DialogTitle>
            <DialogDescription>Request materials for a job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job">
                Job <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.jobId} onValueChange={(val) => setFormData({ ...formData, jobId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_JOBS.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.jobNumber} - {job.vehicleReg} ({job.technicianName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items <span className="text-destructive">*</span></Label>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3 border rounded-lg p-4 max-h-64 overflow-y-auto">
                {requisitionItems.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No items added yet. Click "Add Item" to start.
                  </div>
                ) : (
                  requisitionItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <Label htmlFor={`product-${index}`} className="text-xs">
                          Product
                        </Label>
                        <Select
                          value={item.productId}
                          onValueChange={(val) => handleItemChange(index, 'productId', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {DUMMY_PRODUCTS.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor={`quantity-${index}`} className="text-xs">
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantityRequested}
                          onChange={(e) =>
                            handleItemChange(index, 'quantityRequested', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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
            <Button onClick={handleAdd}>Create Requisition</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Requisition Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Requisition Number</Label>
                  <p className="font-mono font-medium text-lg">{selectedRequisition.requisitionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequisition.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-medium">{selectedRequisition.jobNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{selectedRequisition.vehicleReg}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">{selectedRequisition.technicianName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested Date</Label>
                  <p className="font-medium">{selectedRequisition.requestedDate}</p>
                </div>
                {selectedRequisition.approvedDate && (
                  <div>
                    <Label className="text-muted-foreground">Approved Date</Label>
                    <p className="font-medium">{selectedRequisition.approvedDate}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Items</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Requested</TableHead>
                        <TableHead className="text-center">Issued</TableHead>
                        <TableHead className="text-center">Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequisition.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantityRequested}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.quantityIssued > 0 ? 'default' : 'outline'}>
                              {item.quantityIssued}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantityRequested - item.quantityIssued}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedRequisition.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1">{selectedRequisition.notes}</p>
                </div>
              )}

              {selectedRequisition.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm mt-1 text-destructive">{selectedRequisition.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequisition?.status === 'PENDING' && (
              <>
                <Button onClick={() => handleApprove(selectedRequisition)}>Approve</Button>
                <Button variant="destructive" onClick={() => handleRejectClick(selectedRequisition)}>
                  Reject
                </Button>
              </>
            )}
            {(selectedRequisition?.status === 'APPROVED' || selectedRequisition?.status === 'PARTIALLY_ISSUED') && (
              <Button onClick={() => handleIssueClick(selectedRequisition)}>Issue Items</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Items Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Items</DialogTitle>
            <DialogDescription>
              Enter quantities to issue for {selectedRequisition?.requisitionNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Requested</TableHead>
                    <TableHead className="text-center">Already Issued</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">Issue Now</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequisition?.items.map((item, idx) => {
                    const remaining = item.quantityRequested - item.quantityIssued;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantityRequested}</TableCell>
                        <TableCell className="text-center">{item.quantityIssued}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={remaining > 0 ? 'destructive' : 'default'}>{remaining}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            value={issueQuantities[item.productId] || 0}
                            onChange={(e) =>
                              setIssueQuantities({
                                ...issueQuantities,
                                [item.productId]: Math.min(parseInt(e.target.value) || 0, remaining),
                              })
                            }
                            className="w-20 text-center"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsIssueDialogOpen(false);
                setSelectedRequisition(null);
                setIssueQuantities({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleIssueItems}>Issue Items</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {selectedRequisition?.requisitionNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">
              Reject Requisition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Requisitions;