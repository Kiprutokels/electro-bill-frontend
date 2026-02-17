import { useState } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/api/services/users.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Users2, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Departments = () => {
  const [createMode, setCreateMode] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { list, create, assignUser } = useDepartments(true);

  const users = useQuery({
    queryKey: ["users-for-dept"],
    queryFn: () => usersService.getUsers({ page: 1, limit: 200 }),
  });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const depts = list.data ?? [];
  const userRows = users.data?.data ?? [];

  const handleAssignUser = async (deptId: string) => {
    if (!selectedUserId) {
      toast.error("Select a user");
      return;
    }

    try {
      await assignUser.mutateAsync({
        userId: selectedUserId,
        departmentId: deptId,
        isPrimary,
      });
      toast.success("User assigned to department");
      setAssignOpen(null);
      setSelectedUserId("");
      setIsPrimary(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to assign user");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Team structure for routing tickets and workload
          </p>
        </div>
        <Button onClick={() => setCreateMode((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" />{" "}
          {createMode ? "Close" : "New Department"}
        </Button>
      </div>

      {createMode && (
        <Card>
          <CardHeader>
            <CardTitle>Create Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Code (e.g. SALES)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <Button
              disabled={create.isPending || !form.code || !form.name}
              onClick={async () => {
                try {
                  await create.mutateAsync(form);
                  toast.success("Department created");
                  setForm({ code: "", name: "", description: "" });
                  setCreateMode(false);
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed to create");
                }
              }}
            >
              {create.isPending ? "Creating..." : "Create"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {depts.map((d: any) => (
          <Card key={d.id} className={!d.isActive ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {d.name}{" "}
                  <span className="text-xs text-muted-foreground font-mono">
                    ({d.code})
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {d.description || "—"}
                </p>
              </div>
              <Badge variant={d.isActive ? "default" : "secondary"}>
                {d.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span>{d._count?.members ?? 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{d._count?.tickets ?? 0} tickets</span>
                </div>
              </div>

              <Dialog
                open={assignOpen === d.id}
                onOpenChange={(open) => {
                  if (!open) {
                    setAssignOpen(null);
                    setSelectedUserId("");
                    setIsPrimary(false);
                  } else {
                    setAssignOpen(d.id);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member to {d.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRows.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={isPrimary}
                        onCheckedChange={(c) => setIsPrimary(!!c)}
                      />
                      Set as primary department
                    </label>

                    <Button
                      disabled={!selectedUserId || assignUser.isPending}
                      onClick={() => handleAssignUser(d.id)}
                      className="w-full"
                    >
                      {assignUser.isPending ? "Assigning..." : "Assign User"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {depts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No departments yet. Create one to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Departments;
