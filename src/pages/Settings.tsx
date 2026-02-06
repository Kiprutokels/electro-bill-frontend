import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Building2,
  FileText,
  Settings as SettingsIcon,
  Loader2,
  Save,
  DollarSign,
  CreditCard,
  MessageSquare,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { useSettings } from "@/hooks/useSettings";
import { NotificationMethod } from "@/api/types/settings.types";
import { uploadsService } from "@/api/services/uploads.service";
import { toast } from "sonner";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255),
  businessType: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  email: z
    .string()
    .email("Invalid email")
    .max(100)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().min(1).max(100).default("Kenya"),
  defaultCurrency: z.string().min(3).max(10).default("KES"),
  taxRate: z.number().min(0).max(100).default(16),
  quotationPrefix: z.string().min(1).max(10).default("QUO"),
  invoicePrefix: z.string().min(1).max(10).default("INV"),
  receiptPrefix: z.string().min(1).max(10).default("RCP"),
  logoUrl: z.string().max(255).optional().or(z.literal("")),
  processingFeeEnabled: z.boolean().default(true),
  processingFeeAmount: z.number().min(0).default(1000),
  serviceFeeEnabled: z.boolean().default(false),
  serviceFeePercentage: z.number().min(0).max(100).default(0),

  // SMS Settings
  smsEnabled: z.boolean().default(false),
  smsApiKey: z.string().max(255).optional().or(z.literal("")),
  smsPartnerId: z.string().max(100).optional().or(z.literal("")),
  smsShortcode: z.string().max(20).optional().or(z.literal("")),
  notificationMethod: z.enum(["EMAIL", "SMS", "BOTH"]).default("EMAIL"),

  // Invoice footer/payment/admin emails
  accountsEmail: z
    .string()
    .email("Invalid email")
    .max(100)
    .optional()
    .or(z.literal("")),
  accountsPhone: z.string().max(50).optional().or(z.literal("")),

  bankName: z.string().max(100).optional().or(z.literal("")),
  bankBranch: z.string().max(100).optional().or(z.literal("")),
  bankAccountName: z.string().max(255).optional().or(z.literal("")),
  bankAccountNumber: z.string().max(50).optional().or(z.literal("")),
  bankSwiftCode: z.string().max(50).optional().or(z.literal("")),
  bankBranchCode: z.string().max(50).optional().or(z.literal("")),

  mpesaPaybillNumber: z.string().max(50).optional().or(z.literal("")),
  mpesaAccountNumber: z.string().max(50).optional().or(z.literal("")),

  adminInvoiceEmail1: z
    .string()
    .email("Invalid email")
    .max(100)
    .optional()
    .or(z.literal("")),
  adminInvoiceEmail2: z
    .string()
    .email("Invalid email")
    .max(100)
    .optional()
    .or(z.literal("")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const Settings = () => {
  const { hasPermission } = useAuth();
  const { settings, loading, updating, error, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("business");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: "",
      businessType: "",
      taxNumber: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      country: "Kenya",
      defaultCurrency: "KES",
      taxRate: 16,
      quotationPrefix: "QUO",
      invoicePrefix: "INV",
      receiptPrefix: "RCP",
      logoUrl: "",
      processingFeeEnabled: true,
      processingFeeAmount: 50,
      serviceFeeEnabled: false,
      serviceFeePercentage: 0,
      smsEnabled: false,
      smsApiKey: "",
      smsPartnerId: "",
      smsShortcode: "AUTOMILE",
      notificationMethod: "EMAIL",

      accountsEmail: "",
      accountsPhone: "",
      bankName: "",
      bankBranch: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankSwiftCode: "",
      bankBranchCode: "",
      mpesaPaybillNumber: "",
      mpesaAccountNumber: "",
      adminInvoiceEmail1: "",
      adminInvoiceEmail2: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        businessName: settings.businessName || "",
        businessType: settings.businessType || "",
        taxNumber: settings.taxNumber || "",
        email: settings.email || "",
        phone: settings.phone || "",
        addressLine1: settings.addressLine1 || "",
        addressLine2: settings.addressLine2 || "",
        city: settings.city || "",
        country: settings.country || "Kenya",
        defaultCurrency: settings.defaultCurrency || "KES",
        taxRate: settings.taxRate || 16,
        quotationPrefix: settings.quotationPrefix || "QUO",
        invoicePrefix: settings.invoicePrefix || "INV",
        receiptPrefix: settings.receiptPrefix || "RCP",
        logoUrl: settings.logoUrl || "",
        processingFeeEnabled: settings.processingFeeEnabled ?? true,
        processingFeeAmount: settings.processingFeeAmount || 50,
        serviceFeeEnabled: settings.serviceFeeEnabled ?? false,
        serviceFeePercentage: settings.serviceFeePercentage || 0,
        smsEnabled: settings.smsEnabled ?? false,
        smsApiKey: settings.smsApiKey || "",
        smsPartnerId: settings.smsPartnerId || "",
        smsShortcode: settings.smsShortcode || "AUTOMILE",
        notificationMethod: (settings.notificationMethod as any) || "EMAIL",

        // Invoice footer/payment/admin emails
        accountsEmail: settings.accountsEmail || "",
        accountsPhone: settings.accountsPhone || "",

        bankName: settings.bankName || "",
        bankBranch: settings.bankBranch || "",
        bankAccountName: settings.bankAccountName || "",
        bankAccountNumber: settings.bankAccountNumber || "",
        bankSwiftCode: settings.bankSwiftCode || "",
        bankBranchCode: settings.bankBranchCode || "",

        mpesaPaybillNumber: settings.mpesaPaybillNumber || "",
        mpesaAccountNumber: settings.mpesaAccountNumber || "",

        adminInvoiceEmail1: settings.adminInvoiceEmail1 || "",
        adminInvoiceEmail2: settings.adminInvoiceEmail2 || "",
      });
    }
  }, [settings, form]);

  const canUpdate = hasPermission(PERMISSIONS.SETTINGS_UPDATE);

  const onSubmit = async (data: SettingsFormData) => {
    if (!settings?.id) return;

    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    ) as Partial<SettingsFormData>;

    await updateSettings(settings.id, {
      ...cleanData,
      notificationMethod: cleanData.notificationMethod as NotificationMethod,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadsService.uploadSingle(file);
      form.setValue("logoUrl", url, { shouldDirty: true });
      toast.success("Logo uploaded. Click Save Settings to apply.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission(PERMISSIONS.SETTINGS_READ)) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You don't have permission to view system settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logoUrl = form.watch("logoUrl");

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your business information and invoice settings
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 lg:w-[720px]">
                <TabsTrigger value="business" className="text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm">
                  <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="invoice" className="text-xs sm:text-sm">
                  <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Invoice</span>
                </TabsTrigger>
                <TabsTrigger value="fees" className="text-xs sm:text-sm">
                  <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Fees</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="text-xs sm:text-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">SMS</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Business Tab */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Business Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                disabled={!canUpdate}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!canUpdate} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!canUpdate} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Document Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="quotationPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiptPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Logo URL</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormDescription>
                              You can paste a URL or upload an image below.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canUpdate || uploadingLogo}
                          onClick={() =>
                            document
                              .getElementById("logo-upload-input")
                              ?.click()
                          }
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>

                        <input
                          id="logo-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={!canUpdate || uploadingLogo}
                        />
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="h-4 w-4" />
                        <p className="font-medium">Logo Preview</p>
                      </div>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Company logo"
                          className="max-h-32 w-auto object-contain"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No logo set.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoice Tab */}
            <TabsContent value="invoice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Invoice & Payment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Accounts Contact (Invoice Footer)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountsEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accounts Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                disabled={!canUpdate}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountsPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accounts Phone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bank Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankAccountName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankBranch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankSwiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Swift Code</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankBranchCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Mpesa Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="mpesaPaybillNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paybill Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mpesaAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!canUpdate} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Admin Invoice Emails
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      These emails will receive invoice PDFs when invoices are
                      sent.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminInvoiceEmail1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Email (Primary)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                disabled={!canUpdate}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminInvoiceEmail2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Email (Secondary)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                disabled={!canUpdate}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Fee Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Processing Fee
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Fixed processing fee added to invoices (if enabled)
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="processingFeeEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Processing Fee
                            </FormLabel>
                            <FormDescription>
                              Add a fixed processing fee to all invoices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canUpdate}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="processingFeeAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Processing Fee Amount (
                            {form.watch("defaultCurrency")})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={
                                !canUpdate ||
                                !form.watch("processingFeeEnabled")
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Fixed amount added to each invoice
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Service Charge
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Percentage-based service charge applied to subtotal
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="serviceFeeEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Service Charge
                            </FormLabel>
                            <FormDescription>
                              Add a percentage-based service charge to invoices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canUpdate}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceFeePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Charge Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={
                                !canUpdate || !form.watch("serviceFeeEnabled")
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of subtotal (after discount) added as
                            service charge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications/SMS Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>SMS & Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="notificationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!canUpdate}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select notification method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EMAIL">Email Only</SelectItem>
                            <SelectItem value="SMS">SMS Only</SelectItem>
                            <SelectItem value="BOTH">Email + SMS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose how to send notifications to customers and
                          technicians
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="smsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable SMS Notifications
                          </FormLabel>
                          <FormDescription>
                            Allow sending SMS notifications via TextSMS API
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdate}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smsApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TextSMS API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your TextSMS API key"
                            {...field}
                            disabled={!canUpdate || !form.watch("smsEnabled")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smsPartnerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TextSMS Partner ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your Partner ID"
                            {...field}
                            disabled={!canUpdate || !form.watch("smsEnabled")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smsShortcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS Sender ID / Shortcode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="AUTOMILE"
                            {...field}
                            disabled={!canUpdate || !form.watch("smsEnabled")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {canUpdate && (
            <div className="sticky bottom-4 sm:static sm:bottom-auto bg-background pt-4 border-t sm:border-t-0">
              <Button
                type="submit"
                disabled={updating || !form.formState.isDirty}
                className="w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default Settings;
