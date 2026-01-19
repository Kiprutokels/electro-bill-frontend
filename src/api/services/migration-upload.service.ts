import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../client/endpoints';

export interface RowResult {
  rowNumber: number;
  status: 'success' | 'failed' | 'warning';
  errors: string[];
  warnings: string[];
  createdIds?: {
    customerId?: string;
    vehicleId?: string;
    jobId?: string;
    subscriptionId?: string;
  };
}

export interface ImportSummary {
  message: string;
  dryRun: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  results: RowResult[];
  executionTimeMs: number;
}

export const migrationUploadService = {
  validateFile: async (file: File): Promise<ImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportSummary>(
      API_ENDPOINTS.MIGRATION_UPLOAD.VALIDATE_JOBS,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  importFile: async (file: File): Promise<ImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportSummary>(
      API_ENDPOINTS.MIGRATION_UPLOAD.IMPORT_JOBS,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },
};