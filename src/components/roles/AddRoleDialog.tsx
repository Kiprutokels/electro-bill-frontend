import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  rolesService,
  Role,
  CreateRoleRequest,
} from "@/api/services/roles.service";
import {
  permissionsService,
  Permission,
} from "@/api/services/permissions.service";
import { toast } from "sonner";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleAdded: (role: Role) => void;
}

const AddRoleDialog: React.FC<AddRoleDialogProps> = ({
  open,
  onOpenChange,
  onRoleAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>(
    {},
  );
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: "",
    description: "",
    permissionIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadPermissions();
    }
  }, [open]);

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await permissionsService.getPermissions();
      setPermissions(response.groupedByModule);
    } catch (err: any) {
      toast.error("Failed to load permissions");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Role name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Role name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanData: CreateRoleRequest = {
        name: formData.name.trim().toUpperCase(),
        description: formData.description?.trim() || undefined,
        permissionIds: formData.permissionIds?.length
          ? formData.permissionIds
          : undefined,
      };

      const newRole = await rolesService.createRole(cleanData);
      onRoleAdded(newRole);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create role";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissionIds: [],
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof CreateRoleRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...(prev.permissionIds || []), permissionId]
        : (prev.permissionIds || []).filter((id) => id !== permissionId),
    }));
  };

  const handleModuleToggle = (
    modulePermissions: Permission[],
    checked: boolean,
  ) => {
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...(prev.permissionIds || []), ...modulePermissionIds])]
        : (prev.permissionIds || []).filter(
            (id) => !modulePermissionIds.includes(id),
          ),
    }));
  };

  const isModuleSelected = (modulePermissions: Permission[]): boolean => {
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    return modulePermissionIds.every((id) =>
      formData.permissionIds?.includes(id),
    );
  };

  const isModulePartiallySelected = (
    modulePermissions: Permission[],
  ): boolean => {
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const selected = modulePermissionIds.filter((id) =>
      formData.permissionIds?.includes(id),
    );
    return selected.length > 0 && selected.length < modulePermissionIds.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden p-0">
        <div
          className="flex flex-col"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        >
          {/* ── Fixed header ── */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-6">
            <form
              id="add-role-form"
              onSubmit={handleSubmit}
              className="space-y-6 pb-4"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., SALES_MANAGER"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Role names are automatically converted to uppercase
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe the role and its responsibilities..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Permissions</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.permissionIds?.length || 0} permissions selected
                  </p>
                </div>

                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-8 border rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading permissions...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-4">
                    {Object.entries(permissions).map(
                      ([module, modulePermissions]) => (
                        <div key={module} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`module-${module}`}
                              checked={isModuleSelected(modulePermissions)}
                              onCheckedChange={(checked) =>
                                handleModuleToggle(modulePermissions, !!checked)
                              }
                            />
                            <Label
                              htmlFor={`module-${module}`}
                              className="font-medium text-sm uppercase tracking-wide cursor-pointer"
                            >
                              {module}
                            </Label>
                          </div>

                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {modulePermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={
                                    formData.permissionIds?.includes(
                                      permission.id,
                                    ) || false
                                  }
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(
                                      permission.id,
                                      !!checked,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={permission.id}
                                  className="text-sm cursor-pointer"
                                >
                                  {permission.action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* ── Fixed footer ── */}
          <div className="px-6 py-5 border-t flex-shrink-0 flex gap-2">
            <Button
              type="submit"
              form="add-role-form"
              disabled={loading || loadingPermissions}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Role..." : "Create Role"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoleDialog;
