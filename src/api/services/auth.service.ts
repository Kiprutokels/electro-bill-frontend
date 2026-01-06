import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { 
  LoginRequest, 
  LoginResponse, 
  ChangePasswordRequest, 
  ProfileResponse,
  UpdateProfileRequest 
} from '../types/auth.types';
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

  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ProfileResponse>(
      API_ENDPOINTS.AUTH.PROFILE,
      data
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

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, newPassword }
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
};
