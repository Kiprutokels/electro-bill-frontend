import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsService } from "@/api/services/campaigns.service";

export const useCampaigns = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["campaigns", params],
    queryFn: () => campaignsService.list(params),
  });

  const create = useMutation({
    mutationFn: campaignsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  const previewRecipients = useMutation({
    mutationFn: campaignsService.previewRecipients,
  });

  const schedule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignsService.schedule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  return { list, create, previewRecipients, schedule };
};
