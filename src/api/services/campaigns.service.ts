import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { CreateCampaignRequest, ScheduleCampaignRequest } from "../types/campaign.types";

export const campaignsService = {
  list: async (params: any) => {
    const res = await apiClient.get(API_ENDPOINTS.CAMPAIGNS.BASE, { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(API_ENDPOINTS.CAMPAIGNS.BY_ID(id));
    return res.data;
  },
  create: async (data: CreateCampaignRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.CAMPAIGNS.BASE, data);
    return res.data;
  },
  previewRecipients: async (criteria: any) => {
    const res = await apiClient.post(API_ENDPOINTS.CAMPAIGNS.PREVIEW_RECIPIENTS, criteria);
    return res.data;
  },
  schedule: async (id: string, data: ScheduleCampaignRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.CAMPAIGNS.SCHEDULE(id), data);
    return res.data;
  },
};
