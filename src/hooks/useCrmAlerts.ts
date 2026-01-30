import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmAlertsService } from "@/api/services/crm-alerts.service";

export const useCrmAlerts = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["crm-alerts", params],
    queryFn: () => crmAlertsService.list(params),
  });

  const acknowledge = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => crmAlertsService.acknowledge(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-alerts"] }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolutionNotes }: { id: string; resolutionNotes: string }) => crmAlertsService.resolve(id, resolutionNotes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-alerts"] }),
  });

  return { list, acknowledge, resolve };
};
