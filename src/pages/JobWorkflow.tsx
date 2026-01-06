import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Clock,
  Package,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  Eye,
} from "lucide-react";
import { jobsService } from "@/api/services/jobs.service";
import { invoicesService } from "@/api/services/invoices.service";
import { toast } from "sonner";

const JobWorkflow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(
    null
  );

  const { data: jobWorkflow, isLoading } = useQuery({
    queryKey: ["job-workflow", id],
    queryFn: () => jobsService.getJobWorkflow(id!),
    enabled: !!id,
  });

  // Check if invoice exists when job is completed
  useEffect(() => {
    if (jobWorkflow?.status === "COMPLETED" && id) {
      checkForExistingInvoice();
    }
  }, [jobWorkflow?.status, id]);

  const checkForExistingInvoice = async () => {
    if (!id) return;

    setCheckingInvoice(true);
    try {
      const hasInvoice = await invoicesService.hasInvoiceForJob(id);
      if (hasInvoice) {
        const invoice = await invoicesService.getByJobId(id);
        if (invoice) {
          setExistingInvoiceId(invoice.id);
        }
      }
    } catch (error) {
      console.error("Error checking for existing invoice:", error);
    } finally {
      setCheckingInvoice(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!id) return;

    setGeneratingInvoice(true);
    try {
      const invoice = await invoicesService.createFromJob(id);
      toast.success("Invoice generated successfully");
      navigate(`/invoices/${invoice.id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to generate invoice"
      );
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleViewInvoice = () => {
    if (existingInvoiceId) {
      navigate(`/invoices/${existingInvoiceId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!jobWorkflow) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Job not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workflow } = jobWorkflow;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Job Workflow</h1>
            <p className="text-muted-foreground">
              {jobWorkflow.jobNumber} -{" "}
              {jobWorkflow.customer.businessName ||
                jobWorkflow.customer.contactPerson}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(jobWorkflow.status)}>
            {jobWorkflow.status.replace(/_/g, " ")}
          </Badge>
          {jobWorkflow.status === "COMPLETED" && (
            <>
              {checkingInvoice ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </Button>
              ) : existingInvoiceId ? (
                <Button onClick={handleViewInvoice}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                >
                  {generatingInvoice ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="mr-2 h-4 w-4" />
                  )}
                  Generate Invoice
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Workflow Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="requisitions">
            <Package className="h-4 w-4 mr-2" />
            Requisitions ({workflow.requisitions.length})
          </TabsTrigger>
          <TabsTrigger value="pre-inspection">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Pre-Inspection ({workflow.preInspectionChecklist.length})
          </TabsTrigger>
          <TabsTrigger value="installation">
            <FileText className="h-4 w-4 mr-2" />
            Installation
          </TabsTrigger>
          <TabsTrigger value="post-inspection">
            <CheckCircle className="h-4 w-4 mr-2" />
            Post-Inspection ({workflow.postInspectionChecklist.length})
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.timeline.map((update: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{update.message}</p>
                        <Badge variant="outline">
                          {update.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {update.user.firstName} {update.user.lastName} •{" "}
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requisitions Tab */}
        <TabsContent value="requisitions">
          <Card>
            <CardHeader>
              <CardTitle>Material Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.requisitions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No requisitions submitted
                </p>
              ) : (
                <div className="space-y-4">
                  {workflow.requisitions.map((req: any) => (
                    <Card key={req.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono font-medium">
                              {req.requisitionNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested by {req.technician.user.firstName}{" "}
                              {req.technician.user.lastName} •{" "}
                              {new Date(req.requestedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={getRequisitionStatusColor(req.status)}
                          >
                            {req.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-center">
                                Requested
                              </TableHead>
                              <TableHead className="text-center">
                                Issued
                              </TableHead>
                              <TableHead className="text-center">
                                Pending
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {req.items.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.product.name}
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({item.product.sku})
                                  </span>
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
                            ))}
                          </TableBody>
                        </Table>
                        {req.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                              <strong>Notes:</strong> {req.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Inspection Tab */}
        <TabsContent value="pre-inspection">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Installation Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.preInspectionChecklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pre-inspection data
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checked By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflow.preInspectionChecklist.map(
                      (check: any, idx: number) => (
                        <TableRow key={check.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {check.checklistItem.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getCheckStatusColor(check.status)}
                            >
                              {check.status === "CHECKED" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : check.status === "ISSUE_FOUND" ? (
                                <XCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {check.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {check.technician.user.firstName}{" "}
                            {check.technician.user.lastName}
                          </TableCell>
                          <TableCell>
                            {new Date(check.checkedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {check.notes || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installation Tab */}
        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Installation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    IMEI Numbers
                  </h3>
                  {jobWorkflow.imeiNumbers &&
                  jobWorkflow.imeiNumbers.length > 0 ? (
                    <div className="space-y-1">
                      {jobWorkflow.imeiNumbers.map(
                        (imei: string, idx: number) => (
                          <p
                            key={idx}
                            className="font-mono text-xs md:text-sm bg-muted p-2 rounded"
                          >
                            {imei}
                          </p>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not provided
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    SIM Card
                  </h3>
                  <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.simCardIccid || "Not provided"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    MAC Address
                  </h3>
                  <p className="font-mono text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.macAddress || "Not provided"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    GPS Coordinates
                  </h3>
                  <p className="text-xs md:text-sm bg-muted p-2 rounded">
                    {jobWorkflow.gpsCoordinates || "Not captured"}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    Installation Notes
                  </h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs md:text-sm whitespace-pre-wrap">
                      {jobWorkflow.installationNotes || "No notes provided"}
                    </p>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <h3 className="font-semibold text-sm md:text-base">
                    Installation Photos
                  </h3>
                  {jobWorkflow.photoUrls && jobWorkflow.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobWorkflow.photoUrls.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video overflow-hidden rounded-lg border hover:border-primary transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Installation photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No photos uploaded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post-Inspection Tab */}
        <TabsContent value="post-inspection">
          <Card>
            <CardHeader>
              <CardTitle>Post-Installation Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.postInspectionChecklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No post-inspection data
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checked By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflow.postInspectionChecklist.map(
                      (check: any, idx: number) => (
                        <TableRow key={check.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {check.checklistItem.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getCheckStatusColor(check.status)}
                            >
                              {check.status === "CHECKED" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : check.status === "ISSUE_FOUND" ? (
                                <XCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {check.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {check.technician.user.firstName}{" "}
                            {check.technician.user.lastName}
                          </TableCell>
                          <TableCell>
                            {new Date(check.checkedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {check.notes || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-purple-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-green-600",
    CANCELLED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getRequisitionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    APPROVED: "bg-blue-500",
    PARTIALLY_ISSUED: "bg-orange-500",
    FULLY_ISSUED: "bg-green-500",
    REJECTED: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getCheckStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CHECKED: "bg-green-500",
    NOT_CHECKED: "bg-gray-500",
    ISSUE_FOUND: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    COMPLETED: <CheckCircle className="h-5 w-5 text-green-600" />,
    CANCELLED: <XCircle className="h-5 w-5 text-red-600" />,
    IN_PROGRESS: <Clock className="h-5 w-5 text-purple-600" />,
  };
  return icons[status] || <Clock className="h-5 w-5 text-blue-600" />;
};

export default JobWorkflow;
