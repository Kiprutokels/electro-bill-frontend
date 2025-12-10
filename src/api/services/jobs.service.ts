import apiClient from '../client/axios';
import { PaginatedResponse } from '../types/common.types';

export enum JobType {
  NEW_INSTALLATION = 'NEW_INSTALLATION',
  REPLACEMENT = 'REPLACEMENT',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  UPGRADE = 'UPGRADE',
}

export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  REQUISITION_PENDING = 'REQUISITION_PENDING',
  REQUISITION_APPROVED = 'REQUISITION_APPROVED',
  PRE_INSPECTION_PENDING = 'PRE_INSPECTION_PENDING',
  PRE_INSPECTION_APPROVED = 'PRE_INSPECTION_APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  POST_INSPECTION_PENDING = 'POST_INSPECTION_PENDING',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  CANCELLED = 'CANCELLED',
}

export interface JobTechnician {
  id: string;
  technicianCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  location: string;
  isPrimary: boolean;
  assignedAt: string;
  notes?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  vehicleId?: string;
  jobType: JobType;
  status: JobStatus;
  productIds: string[];
  serviceDescription: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  installationNotes?: string;
  photoUrls?: string[];
  imeiNumbers?: string[];
  gpsCoordinates?: string;
  simCardIccid?: string;
  macAddress?: string;
  createdAt: string;
  updatedAt: string;
  customer: any;
  vehicle?: any;
  technicians?: JobTechnician[];
}

export interface JobWorkflow {
  id: string;
  jobNumber: string;
  customerId: string;
  vehicleId?: string;
  jobType: JobType;
  status: JobStatus;
  productIds: string[];
  serviceDescription: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  installationNotes?: string;
  photoUrls?: string[];
  imeiNumbers?: string[];
  gpsCoordinates?: string;
  simCardIccid?: string;
  macAddress?: string;
  createdAt: string;
  updatedAt: string;
  customer: any;
  vehicle?: any;
  technicians?: JobTechnician[];
  workflow: {
    requisitions: any[];
    preInspectionChecklist: any[];
    postInspectionChecklist: any[];
    timeline: any[];
  };
}

export interface CreateJobRequest {
  customerId: string;
  vehicleId?: string;
  jobType: JobType;
  productIds: string[];
  serviceDescription: string;
  scheduledDate: string;
  installationNotes?: string;
}

export interface AssignTechnicianRequest {
  technicianIds: string[];
  notes?: string;
}

export interface AddTechnicianRequest {
  technicianId: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateJobRequest {
  status?: JobStatus;
  vehicleId?: string;
  productIds?: string[];
  serviceDescription?: string;
  scheduledDate?: string;
  installationNotes?: string;
  photoUrls?: string[];
  imeiNumbers?: string[];
  gpsCoordinates?: string;
  simCardIccid?: string;
  macAddress?: string;
}

export const jobsService = {
  getJobs: async (params: any = {}): Promise<PaginatedResponse<Job>> => {
    const response = await apiClient.get<PaginatedResponse<Job>>('/jobs', { params });
    return response.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  getJobWorkflow: async (id: string): Promise<JobWorkflow> => {
    const response = await apiClient.get<JobWorkflow>(`/jobs/${id}/workflow`);
    return response.data;
  },

  createJob: async (data: CreateJobRequest): Promise<Job> => {
    const response = await apiClient.post<Job>('/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  assignTechnicians: async (id: string, data: AssignTechnicianRequest): Promise<Job> => {
    const response = await apiClient.post<Job>(`/jobs/${id}/assign`, data);
    return response.data;
  },

  addTechnician: async (id: string, data: AddTechnicianRequest): Promise<Job> => {
    const response = await apiClient.post<Job>(`/jobs/${id}/technicians`, data);
    return response.data;
  },

  removeTechnician: async (id: string, technicianId: string, reason?: string): Promise<Job> => {
    const response = await apiClient.delete<Job>(`/jobs/${id}/technicians/${technicianId}`, {
      data: { reason },
    });
    return response.data;
  },

  setPrimaryTechnician: async (id: string, technicianId: string): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}/technicians/${technicianId}/set-primary`);
    return response.data;
  },

  cancelJob: async (id: string, reason?: string): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}/cancel`, { reason });
    return response.data;
  },

  getStatistics: async (): Promise<any> => {
    const response = await apiClient.get('/jobs/statistics');
    return response.data;
  },
};
