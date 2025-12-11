import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/utils/constants";
import { useSettings } from "@/hooks/useSettings";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255),
  businessType: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(100).optional().or(z.literal("")),
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
  logoUrl: z.string().url("Invalid URL").max(255).optional().or(z.literal("")),
  processingFeeEnabled: z.boolean().default(true),
  processingFeeAmount: z.number().min(0).default(1000),
  serviceFeeEnabled: z.boolean().default(false),
  serviceFeePercentage: z.number().min(0).max(100).default(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const Settings = () => {
  const { hasPermission } = useAuth();
  const { settings, loading, updating, error, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("business");

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
      processingFeeAmount: 1000,
      serviceFeeEnabled: false,
      serviceFeePercentage: 0,
    },
  });

  // Populate form when settings are loaded
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
        processingFeeAmount: settings.processingFeeAmount || 1000,
        serviceFeeEnabled: settings.serviceFeeEnabled ?? false,
        serviceFeePercentage: settings.serviceFeePercentage || 0,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!settings?.id) return;

    try {
      // Clean empty strings to undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
      ) as Partial<SettingsFormData>;

      await updateSettings(settings.id, cleanData);
    } catch (err) {
      // Error handled in hook
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

  const canUpdate = hasPermission(PERMISSIONS.SETTINGS_UPDATE);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your business information and system preferences
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Mobile-friendly tabs */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="business" className="text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm">
                  <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="fees" className="text-xs sm:text-sm">
                  <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Fees</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs sm:text-sm">
                  <SettingsIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">System</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Business Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Business Details */}
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

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={!canUpdate} />
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

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Address Information</h3>
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

            {/* Document Settings Tab */}
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

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fees Settings Tab */}
            <TabsContent value="fees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Fee Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Processing Fee */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Processing Fee</h3>
                      <p className="text-sm text-muted-foreground">
                        Fixed processing fee added to job-generated invoices
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="processingFeeEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Processing Fee</FormLabel>
                            <FormDescription>
                              Add a fixed processing fee to all job invoices
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
                          <FormLabel>Processing Fee Amount ({form.watch('defaultCurrency')})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!canUpdate || !form.watch('processingFeeEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            Fixed amount added to each job invoice
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Service Charge */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Service Charge</h3>
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
                            <FormLabel className="text-base">Enable Service Charge</FormLabel>
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
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!canUpdate || !form.watch('serviceFeeEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of subtotal (after discount) added as service charge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Fee Calculation Preview */}
                  <div className="rounded-lg border bg-muted p-4">
                    <h4 className="font-medium mb-2">Fee Calculation Preview</h4>
                    <div className="space-y-1 text-sm">
                      <p>Example Invoice: {form.watch('defaultCurrency')} 10,000</p>
                      {form.watch('serviceFeeEnabled') && (
                        <p>
                          + Service Charge ({form.watch('serviceFeePercentage')}%):{' '}
                          {form.watch('defaultCurrency')}{' '}
                          {(10000 * (form.watch('serviceFeePercentage') / 100)).toFixed(2)}
                        </p>
                      )}
                      {form.watch('processingFeeEnabled') && (
                        <p>
                          + Processing Fee: {form.watch('defaultCurrency')}{' '}
                          {form.watch('processingFeeAmount').toFixed(2)}
                        </p>
                      )}
                      <p className="font-medium pt-2 border-t">
                        Total: {form.watch('defaultCurrency')}{' '}
                        {(
                          10000 +
                          (form.watch('serviceFeeEnabled')
                            ? 10000 * (form.watch('serviceFeePercentage') / 100)
                            : 0) +
                          (form.watch('processingFeeEnabled')
                            ? form.watch('processingFeeAmount')
                            : 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>System Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canUpdate} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!canUpdate}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button  */}
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
