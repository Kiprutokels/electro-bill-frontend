import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "sonner";
import { departmentsService } from "@/api/services/departments.service";
import { usersService } from "@/api/services/users.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck, Building2 } from "lucide-react";

interface AssignTicketCardProps {
  ticket: any;
}

const AssignTicketCard = ({ ticket }: AssignTicketCardProps) => {
  const { assign } = useTickets();

  const [assignedTo, setAssignedTo] = useState<string>(
    ticket.assignedTo ?? "__none__"
  );
  const [assignedDeptId, setAssignedDeptId] = useState<string>(
    ticket.assignedDeptId ?? "__none__"
  );
  const [reason, setReason] = useState("");

  const users = useQuery({
    queryKey: ["users-for-assign"],
    queryFn: () => usersService.getUsers({ page: 1, limit: 200 }),
  });

  const departments = useQuery({
    queryKey: ["departments", false],
    queryFn: () => departmentsService.getAll(false),
  });

  const userRows: any[] = users.data?.data ?? [];
  const deptRows: any[] = departments.data ?? [];

  const effectiveUser = assignedTo === "__none__" ? undefined : assignedTo;
  const effectiveDept =
    assignedDeptId === "__none__" ? undefined : assignedDeptId;
  const canSubmit = !!(effectiveUser || effectiveDept);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assign / Reassign</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Current assignment summary */}
        {(ticket.assignedUser || ticket.assignedDept) && (
          <div className="bg-muted rounded-md p-3 text-xs space-y-1">
            <div className="font-semibold text-foreground text-sm mb-1">
              Current Assignment
            </div>
            {ticket.assignedUser && (
              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {ticket.assignedUser.firstName} {ticket.assignedUser.lastName}
                </span>
              </div>
            )}
            {ticket.assignedDept && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {ticket.assignedDept.name} ({ticket.assignedDept.code})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Assign to User */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Assign to User
          </div>
          <Select
            value={assignedTo}
            onValueChange={setAssignedTo}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Unassign User —</SelectItem>
              {userRows.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({u.email})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assign to Department */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Assign to Department
          </div>
          <Select
            value={assignedDeptId}
            onValueChange={setAssignedDeptId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Unassign Dept —</SelectItem>
              {deptRows.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({d.code})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Reason for assignment (optional)
          </div>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Escalated to billing team..."
          />
        </div>

        <Button
          className="w-full"
          disabled={assign.isPending || !canSubmit}
          onClick={async () => {
            try {
              await assign.mutateAsync({
                id: ticket.id,
                data: {
                  assignedTo: effectiveUser,
                  assignedDeptId: effectiveDept,
                  reason: reason || undefined,
                },
              });
              toast.success("Ticket assigned successfully");
              setReason("");
            } catch (e: any) {
              toast.error(
                e?.response?.data?.message || "Failed to assign ticket"
              );
            }
          }}
        >
          {assign.isPending ? "Assigning..." : "Save Assignment"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AssignTicketCard;
