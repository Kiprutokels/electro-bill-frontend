import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "@/api/services/feedback.service";

export const useFeedback = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["feedback", params],
    queryFn: () => feedbackService.list(params),
  });

  const create = useMutation({
    mutationFn: feedbackService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["crm-alerts"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const acknowledge = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => feedbackService.acknowledge(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) => feedbackService.resolve(id, resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });

  return { list, create, acknowledge, resolve };
};
