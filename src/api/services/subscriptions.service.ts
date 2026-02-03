import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionFilters,
  SubscriptionPaginatedResponse,
  SubscriptionStats,
} from "../types/subscription.types";

export const subscriptionsService = {
  getAll: async (
    page = 1,
    limit = 25,
    search?: string,
    filters: SubscriptionFilters = {},
  ): Promise<SubscriptionPaginatedResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.productId) params.productId = filters.productId;
    if (filters.status) params.status = filters.status;
    if (filters.deviceImei) params.deviceImei = filters.deviceImei;

    const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE, {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Subscription> => {
    const response = await apiClient.get<Subscription>(
      API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id),
    );
    return response.data;
  },

  getByCustomer: async (customerId: string): Promise<Subscription[]> => {
    const response = await apiClient.get<Subscription[]>(
      API_ENDPOINTS.SUBSCRIPTIONS.BY_CUSTOMER(customerId),
    );
    return response.data;
  },

  getDashboardStats: async (): Promise<SubscriptionStats> => {
    const response = await apiClient.get<SubscriptionStats>(
      API_ENDPOINTS.SUBSCRIPTIONS.STATS,
    );
    return response.data;
  },

  create: async (data: CreateSubscriptionRequest): Promise<Subscription> => {
    const response = await apiClient.post<Subscription>(
      API_ENDPOINTS.SUBSCRIPTIONS.BASE,
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateSubscriptionRequest,
  ): Promise<Subscription> => {
    const response = await apiClient.patch<Subscription>(
      API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id),
      data,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<Subscription> => {
    const response = await apiClient.patch<Subscription>(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id)}/cancel`,
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id),
    );
    return response.data;
  },

  checkExpiry: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/check-expiry`,
    );
    return response.data;
  },

  generateRenewalInvoice: async (id: string) => {
    const response = await apiClient.post(
      API_ENDPOINTS.SUBSCRIPTIONS.GENERATE_RENEWAL_INVOICE(id),
    );
    return response.data;
  },

  // ==================== CRM actions ====================
  assignOwner: async (
    subscriptionId: string,
    data: { accountOwnerId: string; followUpFrequencyMonths?: number },
  ) => {
    const res = await apiClient.patch(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(subscriptionId)}/assign-owner`,
      data,
    );
    return res.data;
  },

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
      `${API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(subscriptionId)}/crm-config`,
      data,
    );
    return res.data;
  },

  bulkAssign: async (data: any) => {
    const res = await apiClient.post(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/bulk-assign`,
      data,
    );
    return res.data;
  },

  mySubscriptions: async (params: any) => {
    const res = await apiClient.get(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/my-subscriptions/list`,
      { params },
    );
    return res.data;
  },

  unassigned: async (params: any) => {
    const res = await apiClient.get(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/unassigned/list`,
      { params },
    );
    return res.data;
  },
};

export * from "../types/subscription.types";
