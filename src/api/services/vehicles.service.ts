import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export interface Vehicle {
  id: string;
  vehicleReg: string;
  customerId: string;
  make: string;
  model: string;
  color: string | null;
  chassisNo: string;
  mileage: number | null;
  iccidSimcard: string | null;
  yearOfManufacture: number | null;
  vehicleType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerCode: string;
    businessName: string | null;
    contactPerson: string | null;
    phone: string;
  };
  _count?: {
    jobs: number;
  };
}

export interface CreateVehicleRequest {
  vehicleReg: string;
  customerId: string;
  make: string;
  model: string;
  color?: string;
  chassisNo: string;
  mileage?: number;
  iccidSimcard?: string;
  yearOfManufacture?: number;
  vehicleType?: string;
  isActive?: boolean;
}

export interface UpdateVehicleRequest extends Partial<Omit<CreateVehicleRequest, 'customerId'>> {}

export interface VehicleStatistics {
  total: number;
  active: number;
  withTracker: number;
  pendingSetup: number;
  inactive: number;
}

export const vehiclesService = {
  getVehicles: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<Vehicle>> => {
    const response = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles', {
      params,
    });
    return response.data;
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  getVehiclesByCustomer: async (customerId: string): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/customer/${customerId}`);
    return response.data;
  },

  createVehicle: async (data: CreateVehicleRequest): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id: string, data: UpdateVehicleRequest): Promise<Vehicle> => {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}/toggle-status`);
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/vehicles/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<VehicleStatistics> => {
    const response = await apiClient.get<VehicleStatistics>('/vehicles/statistics');
    return response.data;
  },
};