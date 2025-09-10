import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';
import { Permission } from './roles.service';

export interface PermissionsResponse {
  permissions: Permission[];
  groupedByModule: Record<string, Permission[]>;
  modules: string[];
}

export const permissionsService = {
  getPermissions: async (module?: string): Promise<PermissionsResponse> => {
    const params = module ? { module } : {};
    const response = await apiClient.get<PermissionsResponse>(
      API_ENDPOINTS.PERMISSIONS.BASE,
      { params }
    );
    return response.data;
  },

  getPermissionsByModule: async (module: string): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>(
      API_ENDPOINTS.PERMISSIONS.BY_MODULE(module)
    );
    return response.data;
  },
};
export type { Permission };

