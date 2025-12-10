import apiClient from '../client/axios';
import { Job, JobStatus } from './jobs.service';

export interface TechnicianJobStats {
  assigned: number;
  inProgress: number;
  completed: number;
  pending: number;
}

export interface StartJobRequest {
  jobId: string;
  gpsCoordinates?: string;
}

export interface UpdateJobProgressRequest {
  imeiNumbers?: string[];
  photoUrls?: string[];
  gpsCoordinates?: string;
  installationNotes?: string;
  simCardIccid?: string;
  macAddress?: string;
}

export interface CompleteJobRequest {
  photoUrls: string[];
  imeiNumbers: string[];
  gpsCoordinates?: string;
  installationNotes?: string;
  simCardIccid?: string;
  macAddress?: string;
}

export const technicianJobsService = {
  // Get technician's assigned jobs
  getMyJobs: async (params: {
    status?: JobStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Job[]; meta: any }> => {
    const response = await apiClient.get<{ data: Job[]; meta: any }>(
      '/technician/jobs',
      { params }
    );
    return response.data;
  },

  // Get active job (currently in progress)
  getActiveJob: async (): Promise<Job | null> => {
    const response = await apiClient.get<Job | null>('/technician/jobs/active');
    return response.data;
  },

  // Get my job statistics
  getMyStats: async (): Promise<TechnicianJobStats> => {
    const response = await apiClient.get<TechnicianJobStats>(
      '/technician/jobs/statistics'
    );
    return response.data;
  },

  // Start a job
  startJob: async (data: StartJobRequest): Promise<Job> => {
    const response = await apiClient.post<Job>('/technician/jobs/start', data);
    return response.data;
  },

  // Update job progress
  updateJobProgress: async (
    jobId: string,
    data: UpdateJobProgressRequest
  ): Promise<Job> => {
    const response = await apiClient.patch<Job>(
      `/technician/jobs/${jobId}/progress`,
      data
    );
    return response.data;
  },

  // Complete a job
  completeJob: async (jobId: string, data: CompleteJobRequest): Promise<Job> => {
    const response = await apiClient.post<Job>(
      `/technician/jobs/${jobId}/complete`,
      data
    );
    return response.data;
  },

  // Add vehicle to job
  addVehicleToJob: async (
    jobId: string,
    vehicleData: {
      vehicleReg: string;
      make: string;
      model: string;
      color?: string;
      chassisNo: string;
      mileage?: number;
      yearOfManufacture?: number;
      vehicleType?: string;
    }
  ): Promise<Job> => {
    const response = await apiClient.post<Job>(
      `/technician/jobs/${jobId}/add-vehicle`,
      vehicleData
    );
    return response.data;
  },
};
