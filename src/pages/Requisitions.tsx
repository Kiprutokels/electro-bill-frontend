import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign,
  Send,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  requisitionsService,
  RequisitionStatus,
  CreateRequisitionRequest,
  IssueItemRequest,
} from "@/api/services/requisitions.service";
import { jobsService } from "@/api/services/jobs.service";
import { productsService } from "@/api/services/products.service";
import {
  ProductBatch,
  productBatchesService,
} from "@/api/services/product-batches.service";
import {
  advanceRequestsService,
  AdvanceRequestStatus,
  DisbursementMethod,
} from "@/api/services/advance-requests.service";
import DeviceSelectionDialog from "@/components/inventory/DeviceSelectionDialog";

interface RequisitionItemForm {
  productId: string;
  productName: string;
  quantityRequested: number;
}

const Requisitions = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("materials");

  // Material Requisitions State
  const [materialPage, setMaterialPage] = useState(1);
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
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

  // Advance Requests State
  const [advancePage, setAdvancePage] = useState(1);
  const [advanceSearchTerm, setAdvanceSearchTerm] = useState("");
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [isAdvanceViewOpen, setIsAdvanceViewOpen] = useState(false);
  const [isAdvanceRejectOpen, setIsAdvanceRejectOpen] = useState(false);
  const [isDisburseDialogOpen, setIsDisburseDialogOpen] = useState(false);
  const [advanceRejectionReason, setAdvanceRejectionReason] = useState("");
  const [disbursementData, setDisbursementData] = useState({
    method: DisbursementMethod.MPESA,
    reference: "",
  });
  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [currentIssuingItem, setCurrentIssuingItem] = useState<any>(null);
  const [selectedItemImeis, setSelectedItemImeis] = useState<
    Record<string, string[]>
  >({});

  // Fetch Material Requisitions
  const { data: requisitionsData, isLoading: isLoadingRequisitions } = useQuery(
    {
      queryKey: ["requisitions", materialPage, materialSearchTerm],
      queryFn: () =>
        requisitionsService.getRequisitions({
          page: materialPage,
          limit: 10,
          search: materialSearchTerm,
        }),
    },
  );

  // Fetch Material Statistics
  const { data: materialStats } = useQuery({
    queryKey: ["requisition-statistics"],
    queryFn: requisitionsService.getStatistics,
  });

  // Fetch Advance Requests
  const { data: advanceRequestsData, isLoading: isLoadingAdvances } = useQuery({
    queryKey: ["advance-requests", advancePage, advanceSearchTerm],
    queryFn: () =>
      advanceRequestsService.getAdvanceRequests({
        page: advancePage,
        limit: 10,
        search: advanceSearchTerm,
      }),
  });

  // Fetch Advance Statistics
  const { data: advanceStats } = useQuery({
    queryKey: ["advance-request-statistics"],
    queryFn: advanceRequestsService.getStatistics,
  });

  // Fetch assigned jobs
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

  // Fetch product batches
  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ["product-batches", selectedRequisition?.id],
    queryFn: async () => {
      if (!selectedRequisition) return {};

      const result: Record<string, ProductBatch[]> = {};

      await Promise.all(
        selectedRequisition.items.map(async (item: any) => {
          try {
            const batches = await productBatchesService.getAvailableBatches(
              item.productId,
            );
            result[item.id] = batches;
          } catch (error) {
            console.error(
              `Failed to fetch batches for product ${item.productId}:`,
              error,
            );
            result[item.id] = [];
          }
        }),
      );

      return result;
    },
    enabled: isIssueDialogOpen && !!selectedRequisition,
  });

  // ============= MATERIAL REQUISITIONS MUTATIONS =============

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
        error.response?.data?.message || "Failed to create requisition",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: requisitionsService.approveRequisition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["requisition-statistics"] });
      toast.success("Requisition approved successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve requisition",
      );
    },
  });

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
        error.response?.data?.message || "Failed to reject requisition",
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

  // ============= ADVANCE REQUEST MUTATIONS =============

  const approveAdvanceMutation = useMutation({
    mutationFn: advanceRequestsService.approveAdvanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["advance-request-statistics"],
      });
      toast.success("Advance request approved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve request");
    },
  });

  const rejectAdvanceMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      advanceRequestsService.rejectAdvanceRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["advance-request-statistics"],
      });
      toast.success("Advance request rejected");
      setIsAdvanceRejectOpen(false);
      setSelectedAdvance(null);
      setAdvanceRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject request");
    },
  });

  const disburseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      advanceRequestsService.disburseAdvanceRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["advance-request-statistics"],
      });
      toast.success("Advance disbursed successfully");
      setIsDisburseDialogOpen(false);
      setSelectedAdvance(null);
      setDisbursementData({ method: DisbursementMethod.MPESA, reference: "" });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to disburse advance",
      );
    },
  });

  // ============= HANDLERS =============

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
    value: any,
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
      (item) => !item.productId || item.quantityRequested <= 0,
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
    if (!selectedRequisition || !rejectionReason.trim()) {
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

    const items: IssueItemRequest[] = [];

    for (const item of selectedRequisition.items) {
      const quantity = issueQuantities[item.id] || 0;

      if (quantity > 0) {
        if (!issueBatches[item.id]) {
          toast.error(`Please select a batch for ${item.product.name}`);
          return;
        }

        items.push({
          requisitionItemId: item.id,
          quantityIssued: quantity,
          batchId: issueBatches[item.id],
          imeiNumbers: selectedItemImeis[item.id] || undefined,
        });
      }
    }

    if (items.length === 0) {
      toast.error("Please specify quantities to issue");
      return;
    }

    issueMutation.mutate({ id: selectedRequisition.id, items });
  };

  const handleView = (requisition: any) => {
    setSelectedRequisition(requisition);
    setIsViewDialogOpen(true);
  };

  const handleIssueClick = (requisition: any) => {
    setSelectedRequisition(requisition);
    const initialQuantities: Record<string, number> = {};
    const initialBatches: Record<string, string> = {};

    requisition.items.forEach((item: any) => {
      initialQuantities[item.id] = Math.max(
        0,
        item.quantityRequested - item.quantityIssued,
      );
    });

    setIssueQuantities(initialQuantities);
    setIssueBatches(initialBatches);
    setIsIssueDialogOpen(true);
  };

  const handleRejectClick = (requisition: any) => {
    setSelectedRequisition(requisition);
    setIsRejectDialogOpen(true);
  };

  // Advance Request Handlers
  const handleApproveAdvance = (request: any) => {
    approveAdvanceMutation.mutate(request.id);
  };

  const handleRejectAdvance = () => {
    if (!selectedAdvance || !advanceRejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectAdvanceMutation.mutate({
      id: selectedAdvance.id,
      reason: advanceRejectionReason,
    });
  };

  const handleDisburse = () => {
    if (!selectedAdvance) return;

    disburseMutation.mutate({
      id: selectedAdvance.id,
      data: {
        disbursementMethod: disbursementData.method,
        referenceNumber: disbursementData.reference || undefined,
      },
    });
  };

  const handleViewAdvance = (request: any) => {
    setSelectedAdvance(request);
    setIsAdvanceViewOpen(true);
  };

  const handleDisburseClick = (request: any) => {
    setSelectedAdvance(request);
    setIsDisburseDialogOpen(true);
  };

  const handleRejectAdvanceClick = (request: any) => {
    setSelectedAdvance(request);
    setIsAdvanceRejectOpen(true);
  };

  // ============= UTILITY FUNCTIONS =============

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-yellow-500", icon: Clock },
      APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      PARTIALLY_ISSUED: { color: "bg-orange-500", icon: Package },
      FULLY_ISSUED: { color: "bg-green-500", icon: CheckCircle },
      REJECTED: { color: "bg-red-500", icon: XCircle },
      DISBURSED: { color: "bg-green-500", icon: CheckCircle },
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
  const advanceRequests = advanceRequestsData?.data || [];
  const jobs = jobsData?.data || [];
  const products = productsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requisitions & Advances</h1>
          <p className="text-muted-foreground">
            Manage material requisitions and financial advances
          </p>
        </div>
        {activeTab === "materials" && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Material Requisitions
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Advances
          </TabsTrigger>
        </TabsList>

        {/* ============= MATERIAL REQUISITIONS TAB ============= */}
        <TabsContent value="materials" className="space-y-6">
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
                  {materialStats?.pending || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {materialStats?.approved || 0}
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
                  {materialStats?.partiallyIssued || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Fully Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {materialStats?.fullyIssued || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {materialStats?.rejected || 0}
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
                  value={materialSearchTerm}
                  onChange={(e) => setMaterialSearchTerm(e.target.value)}
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
                    {isLoadingRequisitions ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : requisitions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {materialSearchTerm
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
                              <div className="font-medium">
                                {req.job.jobNumber}
                              </div>
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
                              {req.items
                                .slice(0, 2)
                                .map((item: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium">
                                      {item.product.name}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      ({item.quantityIssued}/
                                      {item.quantityRequested})
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
                                    disabled={approveMutation.isPending}
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
                    Showing {requisitions.length} of{" "}
                    {requisitionsData.meta.total} requisitions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialPage((p) => Math.max(1, p - 1))}
                      disabled={materialPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialPage((p) => p + 1)}
                      disabled={
                        materialPage >= requisitionsData.meta.totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= FINANCIAL ADVANCES TAB ============= */}
        <TabsContent value="advances" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {advanceStats?.pending || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {advanceStats?.approved || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disbursed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {advanceStats?.disbursed || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Disbursed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  KES{" "}
                  {parseFloat(
                    String(advanceStats?.totalDisbursed || "0"),
                  ).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Advance Requests</CardTitle>
                <Input
                  placeholder="Search advances..."
                  value={advanceSearchTerm}
                  onChange={(e) => setAdvanceSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAdvances ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : advanceRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-muted-foreground">
                            No advance requests found.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      advanceRequests.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono font-medium">
                            {req.requestNumber}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {req.technician.user.firstName}{" "}
                              {req.technician.user.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {req.job.jobNumber}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {req.job.vehicle?.vehicleReg || "No vehicle"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {req.requestType.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            KES {parseFloat(req.amount).toLocaleString()}
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
                                onClick={() => handleViewAdvance(req)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {req.status === AdvanceRequestStatus.PENDING && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAdvance(req)}
                                    disabled={approveAdvanceMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleRejectAdvanceClick(req)
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {req.status === AdvanceRequestStatus.APPROVED && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleDisburseClick(req)}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Disburse
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
              {advanceRequestsData &&
                advanceRequestsData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {advanceRequests.length} of{" "}
                      {advanceRequestsData.meta.total} requests
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAdvancePage((p) => Math.max(1, p - 1))
                        }
                        disabled={advancePage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdvancePage((p) => p + 1)}
                        disabled={
                          advancePage >= advanceRequestsData.meta.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============= MATERIAL REQUISITION DIALOGS ============= */}

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
                              parseInt(e.target.value) || 1,
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
                      selectedRequisition.requestedDate,
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
                        selectedRequisition.approvedDate,
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
                        ),
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
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleApprove(selectedRequisition);
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleRejectClick(selectedRequisition);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {(selectedRequisition?.status === RequisitionStatus.APPROVED ||
              selectedRequisition?.status ===
                RequisitionStatus.PARTIALLY_ISSUED) && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleIssueClick(selectedRequisition);
                }}
              >
                Issue Items
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Items Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Items</DialogTitle>
            <DialogDescription>
              Select batch and enter quantities to issue for{" "}
              {selectedRequisition?.requisitionNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isBatchesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading batches...
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Requested</TableHead>
                      <TableHead className="text-center">Issued</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead className="text-center">Batch</TableHead>
                      <TableHead className="text-center">Issue Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequisition?.items.map((item: any) => {
                      const remaining =
                        item.quantityRequested - item.quantityIssued;
                      const batches = batchesData?.[item.id] || [];

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{item.product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.product.sku}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantityRequested}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantityIssued}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                remaining > 0 ? "destructive" : "default"
                              }
                            >
                              {remaining}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Check if product has IMEI numbers
                                const qty = issueQuantities[item.id] || 0;
                                if (qty === 0) {
                                  toast.error("Please enter quantity first");
                                  return;
                                }

                                setCurrentIssuingItem(item);
                                setShowImeiDialog(true);
                              }}
                              disabled={
                                !issueBatches[item.id] ||
                                (issueQuantities[item.id] || 0) === 0
                              }
                            >
                              <Smartphone className="h-4 w-4 mr-1" />
                              {selectedItemImeis[item.id]?.length > 0
                                ? `${selectedItemImeis[item.id].length} Selected`
                                : "Select IMEI"}
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Select
                              value={issueBatches[item.id] || ""}
                              onValueChange={(val) =>
                                setIssueBatches({
                                  ...issueBatches,
                                  [item.id]: val,
                                })
                              }
                              disabled={remaining === 0}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {batches.length === 0 ? (
                                  <SelectItem value="no-batch" disabled>
                                    No batches available
                                  </SelectItem>
                                ) : (
                                  batches.map((batch) => (
                                    <SelectItem
                                      key={batch.id}
                                      value={batch.id}
                                      disabled={batch.quantityRemaining === 0}
                                    >
                                      {batch.batchNumber} •{" "}
                                      {batch.quantityRemaining} left
                                      {batch.expiryDate &&
                                        ` • Exp: ${new Date(
                                          batch.expiryDate,
                                        ).toLocaleDateString()}`}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max={remaining}
                              value={issueQuantities[item.id] || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setIssueQuantities({
                                  ...issueQuantities,
                                  [item.id]: Math.min(
                                    Math.max(0, value),
                                    remaining,
                                  ),
                                });
                              }}
                              className="w-24 text-center"
                              disabled={remaining === 0}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
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
              disabled={issueMutation.isPending || isBatchesLoading}
            >
              {issueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Issue Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Material Requisition Dialog */}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Requisition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============= ADVANCE REQUEST DIALOGS ============= */}

      {/* View Advance Dialog */}
      <Dialog open={isAdvanceViewOpen} onOpenChange={setIsAdvanceViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advance Request Details</DialogTitle>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    Request Number
                  </Label>
                  <p className="font-mono font-medium text-lg">
                    {selectedAdvance.requestNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAdvance.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">
                    {selectedAdvance.technician.user.firstName}{" "}
                    {selectedAdvance.technician.user.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-bold text-primary text-lg">
                    KES {parseFloat(selectedAdvance.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Type</Label>
                  <p className="font-medium">
                    {selectedAdvance.requestType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-medium">{selectedAdvance.job.jobNumber}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedAdvance.description}</p>
              </div>

              {selectedAdvance.justification && (
                <div>
                  <Label className="text-muted-foreground">Justification</Label>
                  <p className="text-sm mt-1">
                    {selectedAdvance.justification}
                  </p>
                </div>
              )}

              {selectedAdvance.disbursementMethod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Disbursement Method
                    </Label>
                    <p className="font-medium">
                      {selectedAdvance.disbursementMethod}
                    </p>
                  </div>
                  {selectedAdvance.referenceNumber && (
                    <div>
                      <Label className="text-muted-foreground">Reference</Label>
                      <p className="font-mono">
                        {selectedAdvance.referenceNumber}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedAdvance.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">
                    Rejection Reason
                  </Label>
                  <p className="text-sm mt-1 text-destructive">
                    {selectedAdvance.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdvanceViewOpen(false)}
            >
              Close
            </Button>
            {selectedAdvance?.status === AdvanceRequestStatus.PENDING && (
              <>
                <Button
                  onClick={() => {
                    setIsAdvanceViewOpen(false);
                    handleApproveAdvance(selectedAdvance);
                  }}
                  disabled={approveAdvanceMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsAdvanceViewOpen(false);
                    handleRejectAdvanceClick(selectedAdvance);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {selectedAdvance?.status === AdvanceRequestStatus.APPROVED && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setIsAdvanceViewOpen(false);
                  handleDisburseClick(selectedAdvance);
                }}
              >
                Disburse
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Advance Dialog */}
      <AlertDialog
        open={isAdvanceRejectOpen}
        onOpenChange={setIsAdvanceRejectOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Advance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedAdvance?.requestNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={advanceRejectionReason}
              onChange={(e) => setAdvanceRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdvanceRejectionReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectAdvance}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                rejectAdvanceMutation.isPending ||
                !advanceRejectionReason.trim()
              }
            >
              {rejectAdvanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentIssuingItem && (
        <DeviceSelectionDialog
          open={showImeiDialog}
          onOpenChange={setShowImeiDialog}
          productId={currentIssuingItem.productId}
          productName={currentIssuingItem.product.name}
          batchId={issueBatches[currentIssuingItem.id]}
          requiredCount={issueQuantities[currentIssuingItem.id] || 0}
          onConfirm={(imeis) => {
            setSelectedItemImeis({
              ...selectedItemImeis,
              [currentIssuingItem.id]: imeis,
            });
            setCurrentIssuingItem(null);
          }}
        />
      )}

      {/* Disburse Dialog */}
      <Dialog
        open={isDisburseDialogOpen}
        onOpenChange={setIsDisburseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Advance</DialogTitle>
            <DialogDescription>
              Record disbursement details for {selectedAdvance?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="method">
                Disbursement Method <span className="text-destructive">*</span>
              </Label>
              <Select
                value={disbursementData.method}
                onValueChange={(val) =>
                  setDisbursementData({
                    ...disbursementData,
                    method: val as DisbursementMethod,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DisbursementMethod.CASH}>Cash</SelectItem>
                  <SelectItem value={DisbursementMethod.MPESA}>
                    M-Pesa
                  </SelectItem>
                  <SelectItem value={DisbursementMethod.BANK_TRANSFER}>
                    Bank Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="Transaction reference"
                value={disbursementData.reference}
                onChange={(e) =>
                  setDisbursementData({
                    ...disbursementData,
                    reference: e.target.value,
                  })
                }
              />
            </div>

            {selectedAdvance && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Amount to Disburse:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    KES {parseFloat(selectedAdvance.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDisburseDialogOpen(false);
                setDisbursementData({
                  method: DisbursementMethod.MPESA,
                  reference: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleDisburse}
              disabled={disburseMutation.isPending}
            >
              {disburseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requisitions;
