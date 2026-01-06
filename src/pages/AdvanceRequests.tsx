import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  advanceRequestsService,
  AdvanceRequestStatus,
  DisbursementMethod,
} from "@/api/services/advance-requests.service";

const AdvanceRequests = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDisburseDialogOpen, setIsDisburseDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [disbursementData, setDisbursementData] = useState({
    method: DisbursementMethod.MPESA,
    reference: "",
  });

  // Fetch requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["advance-requests", page, searchTerm],
    queryFn: () =>
      advanceRequestsService.getAdvanceRequests({
        page,
        limit: 10,
        search: searchTerm,
      }),
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["advance-request-statistics"],
    queryFn: advanceRequestsService.getStatistics,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: advanceRequestsService.approveAdvanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["advance-request-statistics"] });
      toast.success("Advance request approved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve request");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      advanceRequestsService.rejectAdvanceRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["advance-request-statistics"] });
      toast.success("Advance request rejected");
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject request");
    },
  });

  // Disburse mutation
  const disburseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      advanceRequestsService.disburseAdvanceRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["advance-request-statistics"] });
      toast.success("Advance disbursed successfully");
      setIsDisburseDialogOpen(false);
      setSelectedRequest(null);
      setDisbursementData({ method: DisbursementMethod.MPESA, reference: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to disburse advance");
    },
  });

  const handleApprove = (request: any) => {
    approveMutation.mutate(request.id);
  };

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectMutation.mutate({
      id: selectedRequest.id,
      reason: rejectionReason,
    });
  };

  const handleDisburseClick = (request: any) => {
    setSelectedRequest(request);
    setIsDisburseDialogOpen(true);
  };

  const handleDisburse = () => {
    if (!selectedRequest) return;

    disburseMutation.mutate({
      id: selectedRequest.id,
      data: {
        disbursementMethod: disbursementData.method,
        referenceNumber: disbursementData.reference || undefined,
      },
    });
  };

  const handleView = (request: any) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-yellow-500", icon: Clock },
      APPROVED: { color: "bg-blue-500", icon: CheckCircle },
      DISBURSED: { color: "bg-green-500", icon: CheckCircle },
      REJECTED: { color: "bg-red-500", icon: XCircle },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const requests = requestsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Advances</h1>
          <p className="text-muted-foreground">
            Manage technician advance requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
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
            <CardTitle className="text-sm font-medium">Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.disbursed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              KES {parseFloat(String(statistics?.totalDisbursed || "0")).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Requests</CardTitle>
            <Input
              placeholder="Search requests..."
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No advance requests found.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
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
                          <div className="font-medium">{req.job.jobNumber}</div>
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
                        KES {parseFloat(String(req.amount)).toLocaleString()}
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
                          {req.status === AdvanceRequestStatus.PENDING && (
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
          {requestsData && requestsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {requests.length} of {requestsData.meta.total} requests
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
                  disabled={page >= requestsData.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advance Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Request Number</Label>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequest.requestNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Technician</Label>
                  <p className="font-medium">
                    {selectedRequest.technician.user.firstName}{" "}
                    {selectedRequest.technician.user.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-bold text-primary text-lg">
                    KES {parseFloat(selectedRequest.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Type</Label>
                  <p className="font-medium">
                    {selectedRequest.requestType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Number</Label>
                  <p className="font-medium">{selectedRequest.job.jobNumber}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedRequest.description}</p>
              </div>

              {selectedRequest.justification && (
                <div>
                  <Label className="text-muted-foreground">Justification</Label>
                  <p className="text-sm mt-1">{selectedRequest.justification}</p>
                </div>
              )}

              {selectedRequest.disbursementMethod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Disbursement Method</Label>
                    <p className="font-medium">{selectedRequest.disbursementMethod}</p>
                  </div>
                  {selectedRequest.referenceNumber && (
                    <div>
                      <Label className="text-muted-foreground">Reference</Label>
                      <p className="font-mono">{selectedRequest.referenceNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm mt-1 text-destructive">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === AdvanceRequestStatus.PENDING && (
              <>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleApprove(selectedRequest);
                  }}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleRejectClick(selectedRequest);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {selectedRequest?.status === AdvanceRequestStatus.APPROVED && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleDisburseClick(selectedRequest);
                }}
              >
                Disburse
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Advance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedRequest?.requestNumber}
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
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disburse Dialog */}
      <Dialog open={isDisburseDialogOpen} onOpenChange={setIsDisburseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Advance</DialogTitle>
            <DialogDescription>
              Record disbursement details for {selectedRequest?.requestNumber}
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
                  <SelectItem value={DisbursementMethod.MPESA}>M-Pesa</SelectItem>
                  <SelectItem value={DisbursementMethod.BANK_TRANSFER}>
                    Bank Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">
                Reference Number (Optional)
              </Label>
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

            {selectedRequest && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount to Disburse:</span>
                  <span className="text-2xl font-bold text-primary">
                    KES {parseFloat(selectedRequest.amount).toLocaleString()}
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
                setDisbursementData({ method: DisbursementMethod.MPESA, reference: "" });
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

export default AdvanceRequests;
