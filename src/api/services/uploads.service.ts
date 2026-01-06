import apiClient from '@/api/client/axios';

class UploadsService {
  async uploadSingle(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }

  async uploadMultiple(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/uploads/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files.map((f: any) => f.url);
  }

  async deleteFile(filename: string): Promise<void> {
    await apiClient.delete(`/uploads/${filename}`);
  }

  extractFilename(url: string): string {
    return url.split('/').pop() || '';
  }
}

export const uploadsService = new UploadsService();
