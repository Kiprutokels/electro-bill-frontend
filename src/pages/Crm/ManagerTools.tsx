import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { usersService } from "@/api/services/users.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManagerTools() {
  const [search, setSearch] = useState("");
  const [selectedSubs, setSelectedSubs] = useState<Record<string, boolean>>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<"ROUND_ROBIN" | "BY_PRIORITY" | "MANUAL">("ROUND_ROBIN");
  const [assigning, setAssigning] = useState(false);

  const unassigned = useQuery({
    queryKey: ["unassigned-subs", search],
    queryFn: () => subscriptionsService.unassigned({ page: 1, limit: 100, search }),
  });

  const users = useQuery({
    queryKey: ["users-list-manager"],
    queryFn: () => usersService.getUsers({ page: 1, limit: 200 }),
  });

  const rows = unassigned.data?.data ?? [];
  const userRows = users.data?.data ?? [];

  const selectedIds = useMemo(
    () => Object.keys(selectedSubs).filter((id) => selectedSubs[id]),
    [selectedSubs]
  );

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const s of rows) next[s.id] = checked;
    setSelectedSubs(next);
  };

  const bulkAssign = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least 1 user to assign to");
      return;
    }

    if (strategy === "MANUAL" && selectedIds.length === 0) {
      toast.error("Select subscriptions for MANUAL assignment");
      return;
    }

    setAssigning(true);
    try {
      const payload =
        strategy === "MANUAL"
          ? { strategy, userIds: selectedUsers, subscriptionIds: selectedIds }
          : { strategy, userIds: selectedUsers, criteria: { unassignedOnly: true }, limit: 1000 };

      const res = await subscriptionsService.bulkAssign(payload);
      toast.success(`Bulk assignment done: ${res.assigned ?? 0} assigned`);
      setSelectedSubs({});
      unassigned.refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk assign failed");
    } finally {
      setAssigning(false);
    }
  };

  if (unassigned.isLoading || users.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">CRM Manager Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Distribute unassigned subscriptions across sales/support users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" /> Bulk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search unassigned subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ROUND_ROBIN">ROUND_ROBIN</SelectItem>
              <SelectItem value="BY_PRIORITY">BY_PRIORITY</SelectItem>
              <SelectItem value="MANUAL">MANUAL (use selection below)</SelectItem>
            </SelectContent>
          </Select>

          <div className="border rounded-md p-3 space-y-2">
            <div className="text-sm font-medium">Assign to users</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userRows.length > 0 ? (
                userRows.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={(checked) => {
                        setSelectedUsers((prev) =>
                          checked ? [...prev, u.id] : prev.filter((x) => x !== u.id)
                        );
                      }}
                    />
                    <span className="truncate">
                      {u.firstName} {u.lastName} ({u.email})
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No users available</div>
              )}
            </div>
          </div>

          <Button disabled={assigning || selectedUsers.length === 0} onClick={bulkAssign}>
            {assigning ? "Assigning..." : "Run Bulk Assign"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unassigned Subscriptions</CardTitle>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedIds.length === rows.length && rows.length > 0}
              onCheckedChange={(c) => toggleAll(!!c)}
            />
            Select all
          </label>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No unassigned subscriptions.</div>
          ) : (
            rows.map((s) => (
              <div key={s.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!selectedSubs[s.id]}
                    onCheckedChange={(checked) =>
                      setSelectedSubs((prev) => ({ ...prev, [s.id]: !!checked }))
                    }
                  />
                  <div>
                    <div className="font-mono font-semibold">{s.subscriptionNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.customer?.businessName || s.customer?.contactPerson} • {s.product?.name} •{" "}
                      {s.status}
                    </div>
                  </div>
                </label>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}