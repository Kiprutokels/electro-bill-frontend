import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmInteractionsService } from "@/api/services/crm-interactions.service";

export const useCrmInteractions = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["crm-interactions", params],
    queryFn: () => crmInteractionsService.list(params),
  });

  const create = useMutation({
    mutationFn: crmInteractionsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-interactions"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard-my"] });
    },
  });

  return { list, create };
};
