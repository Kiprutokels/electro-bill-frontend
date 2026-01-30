import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CreateTicketRequest, AssignTicketRequest, UpdateTicketStatusRequest, AddTicketCommentRequest } from "../types/ticket.types";

export const ticketsService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.TICKETS.BASE, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.TICKETS.BY_ID(id));
    return res.data;
  },
  create: async (data: CreateTicketRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.TICKETS.BASE, data);
    return res.data;
  },
  assign: async (id: string, data: AssignTicketRequest) => {
    const res = await apiClient.patch(API_ENDPOINTS.TICKETS.ASSIGN(id), data);
    return res.data;
  },
  updateStatus: async (id: string, data: UpdateTicketStatusRequest) => {
    const res = await apiClient.patch(API_ENDPOINTS.TICKETS.STATUS(id), data);
    return res.data;
  },
  addComment: async (id: string, data: AddTicketCommentRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.TICKETS.COMMENTS(id), data);
    return res.data;
  },
};
