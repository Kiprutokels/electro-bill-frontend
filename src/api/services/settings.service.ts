import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { ApiResponse } from "../types/common.types";
import {
  SystemSettings,
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "../types/settings.types";

export const settingsService = {
  // Get current system settings
  getCurrent: async (): Promise<SystemSettings> => {
    const response = await apiClient.get<SystemSettings>(
      API_ENDPOINTS.SETTINGS.BASE
    );
    return response.data;
  },

  // Get all system settings (admin only)
  getAll: async (): Promise<SystemSettings[]> => {
    const response = await apiClient.get<SystemSettings[]>(
      API_ENDPOINTS.SETTINGS.ALL
    );
    return response.data;
  },

  // Create initial system settings
  create: async (data: CreateSettingsRequest): Promise<SystemSettings> => {
    const response = await apiClient.post<SystemSettings>(
      API_ENDPOINTS.SETTINGS.BASE,
      data
    );
    return response.data;
  },

  // Update system settings
  update: async (
    id: string,
    data: UpdateSettingsRequest
  ): Promise<SystemSettings> => {
    const response = await apiClient.patch<SystemSettings>(
      API_ENDPOINTS.SETTINGS.BY_ID(id),
      data
    );
    return response.data;
  },

  // Delete system settings
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.SETTINGS.BY_ID(id)
    );
    return response.data;
  },
};

// Export types for easier imports
export type {
  SystemSettings,
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "../types/settings.types";
