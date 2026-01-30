import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmFollowupsService } from "@/api/services/crm-followups.service";

export const useCrmFollowUps = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["crm-followups", params],
    queryFn: () => crmFollowupsService.list(params),
  });

  const myQueue = useQuery({
    queryKey: ["crm-followups-my-queue", params.windowDays ?? 14],
    queryFn: () => crmFollowupsService.myQueue(params.windowDays ?? 14),
  });

  const create = useMutation({
    mutationFn: crmFollowupsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-followups"] });
      qc.invalidateQueries({ queryKey: ["crm-followups-my-queue"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard-my"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmFollowupsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-followups"] });
      qc.invalidateQueries({ queryKey: ["crm-followups-my-queue"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard-my"] });
    },
  });

  const complete = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmFollowupsService.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-followups"] });
      qc.invalidateQueries({ queryKey: ["crm-followups-my-queue"] });
      qc.invalidateQueries({ queryKey: ["crm-interactions"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard-my"] });
    },
  });

  return { list, myQueue, create, update, complete };
};
