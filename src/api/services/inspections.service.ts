import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export enum ChecklistCategory {
  VEHICLE_EXTERIOR = 'VEHICLE_EXTERIOR',
  VEHICLE_INTERIOR = 'VEHICLE_INTERIOR',
  VEHICLE_ENGINE = 'VEHICLE_ENGINE',
  DEVICE_COMPONENT = 'DEVICE_COMPONENT',
  SAFETY_CHECK = 'SAFETY_CHECK',
}

export enum InspectionStage {
  PRE_INSTALLATION = 'PRE_INSTALLATION',
  POST_INSTALLATION = 'POST_INSTALLATION',
}

export enum CheckStatus {
  CHECKED = 'CHECKED',
  NOT_CHECKED = 'NOT_CHECKED',
  ISSUE_FOUND = 'ISSUE_FOUND',
}


export interface ChecklistItem {
  id: string;
  name: string;
  description: string | null;
  category: ChecklistCategory;
  componentType: string | null;
  vehicleType: string | null;
  isPreInstallation: boolean;
  isPostInstallation: boolean;
  requiresPhoto: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistItemRequest {
  name: string;
  description?: string;
  category: ChecklistCategory;
  componentType?: string;
  vehicleType?: string;
  isPreInstallation?: boolean;
  
  isPostInstallation?: boolean;
  requiresPhoto?: boolean;
  displayOrder?: number;
}

export interface InspectionItemRequest {
  checklistItemId: string;
  status: CheckStatus;
  notes?: string;
  photoUrls?: string[];
}

export interface PerformInspectionRequest {
  jobId: string;
  vehicleId: string;
  inspectionStage: InspectionStage;
  items: InspectionItemRequest[];
}

export interface ChecklistTransaction {
  id: string;
  jobId: string;
  vehicleId: string;
  technicianId: string;
  checklistItemId: string;
  inspectionStage: InspectionStage;
  status: CheckStatus;
  notes: string | null;
  photoUrls: string[];
  checkedAt: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  checklistItem: ChecklistItem;
  technician?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  verifier?: {
    firstName: string;
    lastName: string;
  };
}

export interface InspectionStatistics {
  totalInspections: number;
  pendingPreInstallation: number;
  pendingPostInstallation: number;
  completed: number;
}


//addd
export interface SubmitInspectionRequest {
  jobId: string;
  vehicleId: string;
  inspectionStage: InspectionStage;
  inspections: {
    checklistItemId: string;
    status: CheckStatus;
    notes?: string;
    photoUrls?: string[];
  }[];
}

export const inspectionsService = {
  // Checklist Items
  // getChecklistItems: async (params: {
  //   page?: number;
  //   limit?: number;
  //   search?: string;
  //   category?: ChecklistCategory;
  //   isActive?: boolean;
  // } = {}): Promise<PaginatedResponse<ChecklistItem>> => {
  //   const response = await apiClient.get<PaginatedResponse<ChecklistItem>>(
  //     '/inspections/checklist-items',
  //     { params }
  //   );
  //   return response.data;
  // },

    getChecklistItems: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: ChecklistCategory;
    isActive?: boolean;
    isPreInstallation?: boolean;
    isPostInstallation?: boolean;
  } = {}): Promise<PaginatedResponse<ChecklistItem>> => {
    const response = await apiClient.get<PaginatedResponse<ChecklistItem>>(
      '/inspections/checklist-items',
      { params }
    );
    return response.data;
  },

  getChecklistItemById: async (id: string): Promise<ChecklistItem> => {
    const response = await apiClient.get<ChecklistItem>(
      `/inspections/checklist-items/${id}`
    );
    return response.data;
  },

  createChecklistItem: async (
    data: CreateChecklistItemRequest
  ): Promise<ChecklistItem> => {
    const response = await apiClient.post<ChecklistItem>(
      '/inspections/checklist-items',
      data
    );
    return response.data;
  },

  updateChecklistItem: async (
    id: string,
    data: Partial<CreateChecklistItemRequest>
  ): Promise<ChecklistItem> => {
    const response = await apiClient.patch<ChecklistItem>(
      `/inspections/checklist-items/${id}`,
      data
    );
    return response.data;
  },

  toggleChecklistItemStatus: async (id: string): Promise<ChecklistItem> => {
    const response = await apiClient.patch<ChecklistItem>(
      `/inspections/checklist-items/${id}/toggle-status`
    );
    return response.data;
  },

  deleteChecklistItem: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/inspections/checklist-items/${id}`
    );
    return response.data;
  },

  // Inspection Transactions
  performInspection: async (
    data: PerformInspectionRequest
  ): Promise<{ message: string; transactions: ChecklistTransaction[] }> => {
    const response = await apiClient.post<{
      message: string;
      transactions: ChecklistTransaction[];
    }>('/inspections/perform', data);
    return response.data;
  },

  getJobInspections: async (
    jobId: string,
    stage?: InspectionStage
  ): Promise<ChecklistTransaction[]> => {
    const response = await apiClient.get<ChecklistTransaction[]>(
      `/inspections/job/${jobId}`,
      { params: { stage } }
    );
    return response.data;
  },

  verifyInspection: async (
    jobId: string,
    stage: InspectionStage,
    approved: boolean
  ): Promise<{ message: string; newStatus: string }> => {
    const response = await apiClient.patch<{ message: string; newStatus: string }>(
      `/inspections/verify/${jobId}/${stage}`,
      { approved }
    );
    return response.data;
  },

  getStatistics: async (): Promise<InspectionStatistics> => {
    const response = await apiClient.get<InspectionStatistics>(
      '/inspections/statistics'
    );
    return response.data;
  },

  //added
   submitInspection: async (
    data: SubmitInspectionRequest,
  ): Promise<ChecklistTransaction[]> => {
    const response = await apiClient.post<ChecklistTransaction[]>(
      '/inspections/submit',
      data
    );
    return response.data;
  },
};