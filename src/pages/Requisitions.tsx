import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Minus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  requisitionsService,
  RequisitionStatus,
  CreateRequisitionRequest,
  IssueItemRequest,
} from "@/api/services";
import { jobsService } from "@/api/services";
import { productsService } from "@/api/services";

interface RequisitionItemForm {
  productId: string;
  productName: string;
  quantityRequested: number;
}

const Requisitions = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState<{
    jobId: string;
    notes: string;
  }>({
    jobId: "",
    notes: "",
  });

  const [requisitionItems, setRequisitionItems] = useState<
    RequisitionItemForm[]
  >([]);
  const [issueQuantities, setIssueQuantities] = useState<
    Record<string, number>
  >({});
  const [issueBatches, setIssueBatches] = useState<Record<string, string>>({});

  // Fetch requisitions
  const { data: requisitionsData, isLoading } = useQuery({
    queryKey: ["requisitions", page, searchTerm],
    queryFn: () =>
      requisitionsService.getRequisitions({
        page,
        limit: 10,
        search: searchTerm,
      }),
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["requisition-statistics"],
    queryFn: requisitionsService.getStatistics,
  });

  // Fetch assigned jobs (for creating requisitions)
  const { data: jobsData } = useQuery({
    queryKey: ["jobs-assigned"],
    queryFn: () =>
      jobsService.getJobs({ status: "ASSIGNED" as any, limit: 100 }),
    enabled: isAddDialogOpen,
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const items = await productsService.getAll();
      return { data: items };
    },
    enabled: isAddDialogOpen,
  });

  // Fetch product batches for issue dialog
  const { data: batchesData } = useQuery({
    queryKey: ["product-batches-all"],
    queryFn: async () => {
      // This would need a proper batches endpoint
      // For now, return empty array
      return [];
    },
    enabled: isIssueDialogOpen,
  });

  // Create requisition mutation
  const createMutation = useMutation({
    mutationFn: requisitionsService.createRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["requisition-statistics"] });
      toast.success("Requisition created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create requisition"
      );
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: requisitionsService.approveRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["requisition-statistics"] });
      toast.success("Requisition approved successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve requisition"
      );
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requisitionsService.rejectRequisition(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["requisition-statistics"] });
      toast.success("Requisition rejected");
      setIsRejectDialogOpen(false);
      setSelectedRequisition(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reject requisition"
      );
    },
  });

  // Issue items mutation
  const issueMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: IssueItemRequest[] }) =>
      requisitionsService.issueItems(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["requisition-statistics"] });
      toast.success("Items issued successfully");
      setIsIssueDialogOpen(false);
      setSelectedRequisition(null);
      setIssueQuantities({});
      setIssueBatches({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to issue items");
    },
  });

  const resetForm = () => {
    setFormData({ jobId: "", notes: "" });
    setRequisitionItems([]);
  };

  const handleAddItem = () => {
    setRequisitionItems([
      ...requisitionItems,
      { productId: "", productName: "", quantityRequested: 1 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setRequisitionItems(requisitionItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof RequisitionItemForm,
    value: any
  ) => {
    const updated = [...requisitionItems];
    if (field === "productId") {
      const product = productsData?.data.find((p) => p.id === value);
      updated[index].productId = value;
      updated[index].productName = product?.name || "";
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setRequisitionItems(updated);
  };

  const handleAdd = () => {
    if (!formData.jobId || requisitionItems.length === 0) {
      toast.error("Please select a job and add at least one item");
      return;
    }

    const hasInvalidItems = requisitionItems.some(
      (item) => !item.productId || item.quantityRequested <= 0
    );
    if (hasInvalidItems) {
      toast.error("Please fill all item details correctly");
      return;
    }

    const request: CreateRequisitionRequest = {
      jobId: formData.jobId,
      items: requisitionItems.map((item) => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested,
      })),
      notes: formData.notes,
    };

    createMutation.mutate(request);
  };

  const handleApprove = (requisition: any) => {
    approveMutation.mutate(requisition.id);
  };

  const handleReject = () => {
    if (!selectedRequisition || !rejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectMutation.mutate({
      id: selectedRequisition.id,
      reason: rejectionReason,
    });
  };

  const handleIssueItems = () => {
    if (!selectedRequisition) return;

    const items: IssueItemRequest[] = selectedRequisition.items
      .filter((item: any) => issueQuantities[item.id] > 0)
      .map((item: any) => ({
        requisitionItemId: item.id,
        quantityIssued: issueQuantities[item.id],
        batchId: issueBatches[item.id] || "default-batch-id", // TODO: Fix batch selection
      }));

    if (items.length === 0) {
      toast.error("Please specify quantities to issue");
      return;
    }

    issueMutation.mutate({
      id: selectedRequisition.id,
      items,
    });
  };

  const handleView = (requisition: any) => {
    setSelectedRequisition(requisition);
    setIsViewDialogOpen(true);
  };

  const handleIssueClick = (requisition: any) => {
    setSelectedRequisition(requisition);
    const initialQuantities: Record<string, number> = {};
    requisition.items.forEach((item: any) => {
      initialQuantities[item.id] = Math.max(
        0,
        item.quantityRequested - item.quantityIssued
      );
    });
    setIssueQuantities(initialQuantities);
    setIsIssueDialogOpen(true);
  };

  const handleRejectClick = (requisition: any) => {
    setSelectedRequisition(requisition);
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-yellow-500", icon: Clock },
      APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      PARTIALLY_ISSUED: { color: "bg-orange-500", icon: Package },
      FULLY_ISSUED: { color: "bg-green-500", icon: CheckCircle },
      REJECTED: { color: "bg-red-500", icon: XCircle },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const requisitions = requisitionsData?.data || [];
  const jobs = jobsData?.data || [];
  const products = productsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Material Requisitions</h1>
          <p className="text-muted-foreground">
            Manage equipment requests and issuance
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Requisition
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Partially Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.partiallyIssued || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fully Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.fullyIssued || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.rejected || 0}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : requisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "No requisitions found."
                          : "No requisitions created yet."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-medium">
                        {req.requisitionNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{req.job.jobNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {req.job.vehicle?.vehicleReg || "No vehicle"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {req.technician.user.firstName}{" "}
                          {req.technician.user.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {req.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">
                                {item.product.name}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                ({item.quantityIssued}/{item.quantityRequested})
                              </span>
                            </div>
                          ))}
                          {req.items.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{req.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(req.requestedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(req)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {req.status === RequisitionStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(req)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClick(req)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {(req.status === RequisitionStatus.APPROVED ||
                            req.status ===
                              RequisitionStatus.PARTIALLY_ISSUED) && (
                            <Button
                              size="sm"
                              onClick={() => handleIssueClick(req)}
                            >
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

          {/* Pagination */}
          {requisitionsData && requisitionsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {requisitions.length} of {requisitionsData.meta.total}{" "}
                requisitions
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
                  disabled={page >= requisitionsData.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
              <Select
                value={formData.jobId}
                onValueChange={(val) =>
                  setFormData({ ...formData, jobId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.jobNumber} -{" "}
                      {job.vehicle
                        ? `${job.vehicle.vehicleReg}`
                        : job.customer.businessName ||
                          job.customer.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Items <span className="text-destructive">*</span>
                </Label>
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
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-7">
                        <Label htmlFor={`product-${index}`} className="text-xs">
                          Product
                        </Label>
                        <Select
                          value={item.productId}
                          onValueChange={(val) =>
                            handleItemChange(index, "productId", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label
                          htmlFor={`quantity-${index}`}
                          className="text-xs"
                        >
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantityRequested}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantityRequested",
                              parseInt(e.target.value) || 1
                            )
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
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Requisition
            </Button>
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
                  <Label className="text-muted-foreground">
                    Requisition Number
                  </Label>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequisition.requisitionNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequisition.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-medium">
                    {selectedRequisition.job.jobNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">
                    {selectedRequisition.job.vehicle?.vehicleReg ||
                      "Not assigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">
                    {selectedRequisition.technician.user.firstName}{" "}
                    {selectedRequisition.technician.user.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Requested Date
                  </Label>
                  <p className="font-medium">
                    {new Date(
                      selectedRequisition.requestedDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                {selectedRequisition.approvedDate && (
                  <div>
                    <Label className="text-muted-foreground">
                      Approved Date
                    </Label>
                    <p className="font-medium">
                      {new Date(
                        selectedRequisition.approvedDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Items
                </Label>
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
                      {selectedRequisition.items.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.product.name}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantityRequested}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  item.quantityIssued > 0
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {item.quantityIssued}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantityRequested - item.quantityIssued}
                            </TableCell>
                          </TableRow>
                        )
                      )}
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
                  <Label className="text-muted-foreground">
                    Rejection Reason
                  </Label>
                  <p className="text-sm mt-1 text-destructive">
                    {selectedRequisition.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedRequisition?.status === RequisitionStatus.PENDING && (
              <>
                <Button onClick={() => handleApprove(selectedRequisition)}>
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectClick(selectedRequisition)}
                >
                  Reject
                </Button>
              </>
            )}
            {(selectedRequisition?.status === RequisitionStatus.APPROVED ||
              selectedRequisition?.status ===
                RequisitionStatus.PARTIALLY_ISSUED) && (
              <Button onClick={() => handleIssueClick(selectedRequisition)}>
                Issue Items
              </Button>
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
              Enter quantities to issue for{" "}
              {selectedRequisition?.requisitionNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Requested</TableHead>
                    <TableHead className="text-center">
                      Already Issued
                    </TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">Issue Now</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequisition?.items.map((item: any, idx: number) => {
                    const remaining =
                      item.quantityRequested - item.quantityIssued;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityRequested}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityIssued}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={remaining > 0 ? "destructive" : "default"}
                          >
                            {remaining}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            value={issueQuantities[item.id] || 0}
                            onChange={(e) =>
                              setIssueQuantities({
                                ...issueQuantities,
                                [item.id]: Math.min(
                                  parseInt(e.target.value) || 0,
                                  remaining
                                ),
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
                setIssueBatches({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueItems}
              disabled={issueMutation.isPending}
            >
              {issueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Issue Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedRequisition?.requisitionNumber}
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
            <AlertDialogCancel onClick={() => setRejectionReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Requisition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Requisitions;
