import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { PaginatedResponse, ApiResponse } from '../types/common.types';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
  userCount: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export const rolesService = {
  getRoles: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Role>> => {
    const response = await apiClient.get<PaginatedResponse<Role>>(
      API_ENDPOINTS.ROLES.BASE,
      { params }
    );
    return response.data;
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<Role>(
      API_ENDPOINTS.ROLES.BY_ID(id)
    );
    return response.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post<Role>(
      API_ENDPOINTS.ROLES.BASE,
      data
    );
    return response.data;
  },

  updateRole: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await apiClient.patch<Role>(
      API_ENDPOINTS.ROLES.BY_ID(id),
      data
    );
    return response.data;
  },

  deleteRole: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.ROLES.BY_ID(id)
    );
    return response.data;
  },

  assignPermissions: async (id: string, data: AssignPermissionsRequest): Promise<ApiResponse> => {
    const response = await apiClient.patch<ApiResponse>(
      `${API_ENDPOINTS.ROLES.BY_ID(id)}/permissions`,
      data
    );
    return response.data;
  },
};
