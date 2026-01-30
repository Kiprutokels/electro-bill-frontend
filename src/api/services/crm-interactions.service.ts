import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CreateCrmInteractionRequest } from "../types/crm.types";

export const crmInteractionsService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.INTERACTIONS, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.CRM.INTERACTION_BY_ID(id));
    return res.data;
  },
  create: async (data: CreateCrmInteractionRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.CRM.INTERACTIONS, data);
    return res.data;
  },
};
