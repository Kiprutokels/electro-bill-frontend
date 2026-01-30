import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import { Department, AssignUserDepartmentRequest } from "../types/department.types";

export const departmentsService = {
  getAll: async (includeInactive = false): Promise<Department[]> => {
    const res = await apiClient.get(API_ENDPOINTS.DEPARTMENTS.BASE, { params: { includeInactive } });
    return res.data;
  },

  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get(API_ENDPOINTS.DEPARTMENTS.BY_ID(id));
    return res.data;
  },

  create: async (data: { code: string; name: string; description?: string }): Promise<Department> => {
    const res = await apiClient.post(API_ENDPOINTS.DEPARTMENTS.BASE, data);
    return res.data;
  },

  update: async (id: string, data: any): Promise<Department> => {
    const res = await apiClient.patch(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), data);
    return res.data;
  },

  assignUser: async (data: AssignUserDepartmentRequest) => {
    const res = await apiClient.post(API_ENDPOINTS.DEPARTMENTS.ASSIGN_USER, data);
    return res.data;
  },

  removeUser: async (departmentId: string, userId: string) => {
    const res = await apiClient.delete(API_ENDPOINTS.DEPARTMENTS.REMOVE_USER(departmentId, userId));
    return res.data;
  },
};
