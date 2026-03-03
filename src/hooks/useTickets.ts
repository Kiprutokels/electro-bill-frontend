import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsService } from "@/api/services/tickets.service";

export const useTickets = (params: any = {}) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["tickets", params],
    queryFn: () => ticketsService.list(params),
  });

  const create = useMutation({
    mutationFn: ticketsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });

  const assign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ticketsService.assign(id, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", v.id] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ticketsService.updateStatus(id, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", v.id] });
    },
  });

  const addComment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ticketsService.addComment(id, data),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["ticket", v.id] }),
  });

  return { list, create, assign, updateStatus, addComment };
};