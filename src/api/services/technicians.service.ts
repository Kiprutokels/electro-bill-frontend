import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export interface Technician {
  id: string;
  userId: string;
  technicianCode: string;
  specialization: string[];
  location: string;
  isAvailable: boolean;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
  };
  completedJobs?: number;
  _count?: {
    jobs: number;
  };
}

export interface CreateTechnicianRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  specialization: string[];
  location: string;
  isAvailable?: boolean;
}

export interface UpdateTechnicianRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string[];
  location?: string;
  isAvailable?: boolean;
}

export const techniciansService = {
  getTechnicians: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    isAvailable?: boolean;
  } = {}): Promise<PaginatedResponse<Technician>> => {
    const response = await apiClient.get<PaginatedResponse<Technician>>(
      '/technicians',
      { params }
    );
    return response.data;
  },

  getTechnicianById: async (id: string): Promise<Technician> => {
    const response = await apiClient.get<Technician>(`/technicians/${id}`);
    return response.data;
  },

  createTechnician: async (data: CreateTechnicianRequest): Promise<Technician> => {
    const response = await apiClient.post<Technician>('/technicians', data);
    return response.data;
  },

  updateTechnician: async (
    id: string,
    data: UpdateTechnicianRequest
  ): Promise<Technician> => {
    const response = await apiClient.patch<Technician>(
      `/technicians/${id}`,
      data
    );
    return response.data;
  },

  toggleAvailability: async (id: string): Promise<Technician> => {
    const response = await apiClient.patch<Technician>(
      `/technicians/${id}/toggle-availability`
    );
    return response.data;
  },

  deleteTechnician: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/technicians/${id}`
    );
    return response.data;
  },

  getNearestAvailable: async (params: {
    location: string;
    specialization?: string[];
  }): Promise<Technician[]> => {
    const response = await apiClient.get<Technician[]>(
      '/technicians/nearest-available',
      { params }
    );
    return response.data;
  },
};