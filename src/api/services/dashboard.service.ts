import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { DashboardOverview, DashboardQueryDto } from '../types/dashboard.types';

export const dashboardService = {
  async getDashboardOverview(params?: DashboardQueryDto): Promise<DashboardOverview> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OVERVIEW, {
      params,
    });
    return response.data;
  },
};

export type { DashboardOverview, DashboardQueryDto };
