import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";

export const subscriptionsCrmService = {
  // Assign owner
  assignOwner: async (
    subscriptionId: string,
    data: { accountOwnerId: string; followUpFrequencyMonths?: number },
  ) => {
    const res = await apiClient.patch(
      `${API_ENDPOINTS.SUBSCRIPTIONS_CRM.BASE}/${subscriptionId}/assign-owner`,
      data,
    );
    return res.data;
  },

  // Update CRM config
  updateCrmConfig: async (
    subscriptionId: string,
    data: {
      followUpFrequencyMonths?: number;
      followUpTimesPerYear?: number;
      priority?: "NORMAL" | "HIGH_VALUE" | "CRITICAL";
      crmStatus?: "ACTIVE" | "PAUSED" | "AT_RISK" | "CANCELLED";
      tags?: string[];
    },
  ) => {
    const res = await apiClient.patch(
      `${API_ENDPOINTS.SUBSCRIPTIONS_CRM.BASE}/${subscriptionId}/crm-config`,
      data,
    );
    return res.data;
  },

  // Bulk assign
  bulkAssign: async (data: any) => {
    const res = await apiClient.post(
      `${API_ENDPOINTS.SUBSCRIPTIONS_CRM.BASE}/bulk-assign`,
      data,
    );
    return res.data;
  },

  // My subscriptions portfolio
  mySubscriptions: async (params: any) => {
    const res = await apiClient.get(
      `${API_ENDPOINTS.SUBSCRIPTIONS_CRM.BASE}/my-subscriptions`,
      { params },
    );
    return res.data;
  },

  // Unassigned queue
  unassigned: async (params: any) => {
    const res = await apiClient.get(
      `${API_ENDPOINTS.SUBSCRIPTIONS_CRM.BASE}/unassigned`,
      { params },
    );
    return res.data;
  },
};