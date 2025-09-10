import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { LoginRequest, LoginResponse, ChangePasswordRequest, ProfileResponse } from '../types/auth.types';
import { ApiResponse } from '../types/common.types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>(
      API_ENDPOINTS.AUTH.PROFILE
    );
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.patch<ApiResponse>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
};
