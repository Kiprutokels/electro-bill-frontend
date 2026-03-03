import { useQuery } from "@tanstack/react-query";
import { departmentsService } from "@/api/services/departments.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";

interface DepartmentMembersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departmentId: string;
  departmentName: string;
}

const DepartmentMembersDialog = ({
  open,
  onOpenChange,
  departmentId,
  departmentName,
}: DepartmentMembersDialogProps) => {
  const { removeUser, assignUser } = useDepartments(true);

  const q = useQuery({
    queryKey: ["department", departmentId],
    queryFn: () => departmentsService.getById(departmentId),
    enabled: open && !!departmentId,
  });

  const members: any[] = q.data?.members ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Members — {departmentName}
            <span className="text-xs text-muted-foreground font-normal ml-2">
              ({members.length} member{members.length !== 1 ? "s" : ""})
            </span>
          </DialogTitle>
        </DialogHeader>

        {q.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No members in this department.
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {members.map((m: any) => {
              const userId = m.userId; // From UserDepartment.userId field
              return (
                <div
                  key={m.id}
                  className="border rounded-md p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span>
                        {m.user?.firstName} {m.user?.lastName}
                      </span>
                      {m.isPrimary && (
                        <Badge
                          variant="default"
                          className="text-xs px-1.5 py-0 flex items-center gap-1"
                        >
                          <Star className="h-2.5 w-2.5" />
                          Primary
                        </Badge>
                      )}
                      {m.user?.isActive === false && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.user?.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!m.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={assignUser.isPending}
                        title="Set as primary department for this user"
                        onClick={async () => {
                          try {
                            await assignUser.mutateAsync({
                              userId,
                              departmentId,
                              isPrimary: true,
                            });
                            toast.success("Primary department updated");
                          } catch (e: any) {
                            toast.error(
                              e?.response?.data?.message ||
                                "Failed to update primary"
                            );
                          }
                        }}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Make Primary
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={removeUser.isPending}
                      onClick={async () => {
                        try {
                          await removeUser.mutateAsync({
                            departmentId,
                            userId,
                          });
                          toast.success("User removed from department");
                        } catch (e: any) {
                          toast.error(
                            e?.response?.data?.message ||
                              "Failed to remove user"
                          );
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentMembersDialog;
