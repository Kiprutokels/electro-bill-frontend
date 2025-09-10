import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse } from '../types/common.types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

export const usersService = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>(
      API_ENDPOINTS.USERS.BASE,
      { params }
    );
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(
      API_ENDPOINTS.USERS.BY_ID(id)
    );
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>(
      API_ENDPOINTS.USERS.BASE,
      data
    );
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
  },

  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.TOGGLE_STATUS(id)
    );
    return response.data;
  },

  resetUserPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.patch(
      API_ENDPOINTS.USERS.RESET_PASSWORD(id),
      { newPassword }
    );
  },
};
