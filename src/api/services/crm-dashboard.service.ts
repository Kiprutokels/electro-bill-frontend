import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CrmMyDashboard, CrmManagerDashboard } from "../types/crm.types";

export const crmDashboardService = {
  my: async (windowDays = 14): Promise<CrmMyDashboard> => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.DASHBOARD_MY, { params: { windowDays } });
    return res.data;
  },
  manager: async (windowDays = 14): Promise<CrmManagerDashboard> => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.DASHBOARD_MANAGER, { params: { windowDays } });
    return res.data;
  },
};
