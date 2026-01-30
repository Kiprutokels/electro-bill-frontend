import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CreateFeedbackRequest } from "../types/feedback.types";

export const feedbackService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.FEEDBACK.BASE, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.FEEDBACK.BY_ID(id));
    return res.data;
  },
  create: async (data: CreateFeedbackRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.FEEDBACK.BASE, data);
    return res.data;
  },
  acknowledge: async (id: string, notes?: string) => {
    const res = await apiClient.patch(API_ENDPOINTS.FEEDBACK.ACK(id), { notes });
    return res.data;
  },
  resolve: async (id: string, resolution: string) => {
    const res = await apiClient.patch(API_ENDPOINTS.FEEDBACK.RESOLVE(id), { resolution });
    return res.data;
  },
};
