import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CreateFollowUpRequest, CompleteFollowUpRequest } from "../types/crm.types";

export const crmFollowupsService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.FOLLOWUPS, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.FOLLOWUP_BY_ID(id));
    return res.data;
  },
  myQueue: async (windowDays = 14) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.FOLLOWUP_MY_QUEUE, { params: { windowDays } });
    return res.data;
  },
  create: async (data: CreateFollowUpRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.CRM.FOLLOWUPS, data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(API_ENDPOINTS.CRM.FOLLOWUP_BY_ID(id), data);
    return res.data;
  },
  complete: async (id: string, data: CompleteFollowUpRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.CRM.FOLLOWUP_COMPLETE(id), data);
    return res.data;
  },
};
