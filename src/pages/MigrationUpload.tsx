import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
} from "lucide-react";
import {
  migrationUploadService,
  ImportSummary,
  RowResult,
} from "@/api/services/migration-upload.service";
import { toast } from "sonner";

const MigrationUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ImportSummary | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
      setValidationResult(null);
      setImportResult(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setValidating(true);
    setValidationResult(null);
    try {
      const result = await migrationUploadService.validateFile(selectedFile);
      setValidationResult(result);

      if (result.failedCount === 0) {
        toast.success(
          `Validation passed! ${result.successCount} rows ready to import`,
        );
      } else {
        toast.warning(`Validation completed with ${result.failedCount} errors`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleImportClick = () => {
    if (!validationResult) {
      toast.error("Please validate the file first");
      return;
    }
    if (validationResult.failedCount > 0) {
      toast.error(
        "Cannot import file with validation errors. Please fix the errors first.",
      );
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleImportConfirm = async () => {
    setShowConfirmDialog(false);
    if (!selectedFile) return;

    setImporting(true);
    setImportResult(null);
    try {
      const result = await migrationUploadService.importFile(selectedFile);
      setImportResult(result);

      if (result.failedCount === 0) {
        toast.success(
          `Import completed successfully! ${result.successCount} jobs imported`,
        );
      } else {
        toast.warning(`Import completed with ${result.failedCount} failures`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Link to your generated template
    window.open("/DeviceSample.xlsx", "_blank");
  };

  const getStatusBadge = (status: RowResult["status"]) => {
    const configs = {
      success: {
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-green-500 text-white",
      },
      warning: {
        variant: "default" as const,
        icon: AlertTriangle,
        className: "bg-yellow-500 text-white",
      },
      failed: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-500 text-white",
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const currentResult = importResult || validationResult;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Migration Upload</h1>
        <p className="text-muted-foreground mt-1">
          Import historical client data from Excel template
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Follow these steps to import your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              1
            </div>
            <div>
              <p className="font-medium">Download the Excel template</p>
              <p className="text-sm text-muted-foreground">
                Use the provided template to ensure correct format
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              2
            </div>
            <div>
              <p className="font-medium">Fill in your client data</p>
              <p className="text-sm text-muted-foreground">
                Enter customer, vehicle, job, and subscription information.
                Fields marked with * are required.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              3
            </div>
            <div>
              <p className="font-medium">Upload and validate</p>
              <p className="text-sm text-muted-foreground">
                Upload the file and click "Validate" to check for errors before
                importing
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              4
            </div>
            <div>
              <p className="font-medium">Import data</p>
              <p className="text-sm text-muted-foreground">
                Once validation passes, click "Import" to add the data to the
                system
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={validating || importing}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleValidate}
                disabled={!selectedFile || validating || importing}
                variant="outline"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Validate
                  </>
                )}
              </Button>
              <Button
                onClick={handleImportClick}
                disabled={
                  !validationResult ||
                  validationResult.failedCount > 0 ||
                  importing
                }
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Alert for auto-creation features */}
          {validationResult && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Auto-Creation Enabled:</strong> Missing products will be
                auto-created with default values. Missing technicians will be
                created as placeholder accounts (inactive).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              {importResult ? "Import" : "Validation"} Results
            </CardTitle>
            <CardDescription>
              Processed in {currentResult.executionTimeMs}ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{currentResult.totalRows}</p>
              </div>
              <div className="border rounded-lg p-4 border-l-4 border-l-green-500">
                <p className="text-sm text-muted-foreground">Success</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentResult.successCount}
                </p>
              </div>
              <div className="border rounded-lg p-4 border-l-4 border-l-yellow-500">
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {currentResult.warningCount}
                </p>
              </div>
              <div className="border rounded-lg p-4 border-l-4 border-l-red-500">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {currentResult.failedCount}
                </p>
              </div>
            </div>

            <Progress
              value={
                (currentResult.successCount / currentResult.totalRows) * 100
              }
            />

            {/* Detailed Results Table */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Messages</TableHead>
                    {importResult && <TableHead>Created IDs</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentResult.results.map((result) => (
                    <TableRow key={result.rowNumber}>
                      <TableCell className="font-mono">
                        {result.rowNumber}
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {result.errors.map((error, idx) => (
                            <p key={idx} className="text-sm text-red-600">
                              <XCircle className="w-3 h-3 inline mr-1" />
                              {error}
                            </p>
                          ))}
                          {result.warnings.map((warning, idx) => (
                            <p key={idx} className="text-sm text-yellow-600">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {warning}
                            </p>
                          ))}
                          {result.status === "success" &&
                            result.errors.length === 0 &&
                            result.warnings.length === 0 && (
                              <p className="text-sm text-green-600">
                                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                Row processed successfully
                              </p>
                            )}
                        </div>
                      </TableCell>
                      {importResult && (
                        <TableCell>
                          {result.createdIds && (
                            <div className="text-xs font-mono space-y-1">
                              {result.createdIds.customerId && (
                                <p>
                                  Customer:{" "}
                                  {result.createdIds.customerId.substring(0, 8)}
                                  ...
                                </p>
                              )}
                              {result.createdIds.vehicleId && (
                                <p>
                                  Vehicle:{" "}
                                  {result.createdIds.vehicleId.substring(0, 8)}
                                  ...
                                </p>
                              )}
                              {result.createdIds.jobId && (
                                <p>
                                  Job: {result.createdIds.jobId.substring(0, 8)}
                                  ...
                                </p>
                              )}
                              {result.createdIds.subscriptionId && (
                                <p>
                                  Subscription:{" "}
                                  {result.createdIds.subscriptionId.substring(
                                    0,
                                    8,
                                  )}
                                  ...
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Import Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import {validationResult?.successCount} rows into
              the database. This action will create customers, vehicles, jobs,
              and subscriptions.
              <br />
              <br />
              <strong>Note:</strong> Missing products and technicians will be
              auto-created.
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Yes, Import Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MigrationUpload;
