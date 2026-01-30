import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "@/api/services/departments.service";

export const useDepartments = (includeInactive = false) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["departments", includeInactive],
    queryFn: () => departmentsService.getAll(includeInactive),
  });

  const create = useMutation({
    mutationFn: departmentsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => departmentsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const assignUser = useMutation({
    mutationFn: departmentsService.assignUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  return { list, create, update, assignUser };
};
