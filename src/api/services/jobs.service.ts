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

export interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  vehicleId: string | null;
  technicianId: string | null;
  jobType: JobType;
  status: JobStatus;
  productIds: string[];
  serviceDescription: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  devicePosition: string | null;
  installationNotes: string | null;
  photoUrls: string[];
  imeiNumbers: string[];
  gpsCoordinates: string | null;
  consentFormUrl: string | null;
  customerSignatureUrl: string | null;
  consentDate: string | null;
  paymentVerified: boolean;
  certificateUrl: string | null;
  certificateIssueDate: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerCode: string;
    businessName: string | null;
    contactPerson: string | null;
    phone: string;
    email: string | null;
  };
  vehicle?: {
    id: string;
    vehicleReg: string;
    make: string;
    model: string;
    color: string | null;
    chassisNo: string;
  };
  technician?: {
    id: string;
    technicianCode: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
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

export interface UpdateJobRequest {
  vehicleId?: string;
  jobType?: JobType;
  status?: JobStatus;
  productIds?: string[];
  serviceDescription?: string;
  scheduledDate?: string;
  devicePosition?: string;
  installationNotes?: string;
  photoUrls?: string[];
  imeiNumbers?: string[];
  gpsCoordinates?: string;
}

export interface AssignTechnicianRequest {
  technicianIds: string[];
  notes?: string;
}

export interface JobStatistics {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  awaitingInspection: number;
}

export const jobsService = {
  getJobs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: JobStatus;
    customerId?: string;
    technicianId?: string;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<PaginatedResponse<Job>> => {
    const response = await apiClient.get<PaginatedResponse<Job>>('/jobs', {
      params,
    });
    return response.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: CreateJobRequest): Promise<Job> => {
    const response = await apiClient.post<Job>('/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: UpdateJobRequest): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  assignTechnicians: async (
    id: string,
    data: AssignTechnicianRequest
  ): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}/assign`, data);
    return response.data;
  },

  reassignTechnician: async (
    id: string,
    technicianId: string
  ): Promise<Job> => {
    const response = await apiClient.patch<Job>(
      `/jobs/${id}/reassign/${technicianId}`
    );
    return response.data;
  },

  cancelJob: async (id: string, reason?: string): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  getStatistics: async (): Promise<JobStatistics> => {
    const response = await apiClient.get<JobStatistics>('/jobs/statistics');
    return response.data;
  },
};