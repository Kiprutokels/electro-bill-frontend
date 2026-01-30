import { useState } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const Departments = () => {
  const [createMode, setCreateMode] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  const { list, create } = useDepartments(true);

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const depts = list.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">Team structure for routing and management</p>
        </div>
        <Button onClick={() => setCreateMode((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" /> {createMode ? "Close" : "New Department"}
        </Button>
      </div>

      {createMode && (
        <Card>
          <CardHeader><CardTitle>Create Department</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Code (e.g. SALES)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

      <Card>
        <CardHeader><CardTitle>Department List</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {depts.map((d: any) => (
            <div key={d.id} className="border rounded-md p-3">
              <div className="font-medium">{d.name} <span className="text-xs text-muted-foreground">({d.code})</span></div>
              <div className="text-sm text-muted-foreground">{d.description || "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Members: {d._count?.members ?? 0} • Tickets: {d._count?.tickets ?? 0} • {d.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          ))}
          {depts.length === 0 && <div className="text-sm text-muted-foreground">No departments.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Departments;
