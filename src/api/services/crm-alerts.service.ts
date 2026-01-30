import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";

export const crmAlertsService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.ALERTS, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.ALERT_BY_ID(id));
    return res.data;
  },
  acknowledge: async (id: string, notes?: string) => {
    const res = await apiClient.patch(API_ENDPOINTS.CRM.ALERT_ACK(id), { notes });
    return res.data;
  },
  resolve: async (id: string, resolutionNotes: string) => {
    const res = await apiClient.patch(API_ENDPOINTS.CRM.ALERT_RESOLVE(id), { resolutionNotes });
    return res.data;
  },
};
