import axiosClient from './axiosClient';
import type {
  ResumeUploadResponse,
  ResumeListResponse,
  ResumeDetailResponse,
  ApiResponse,
} from '../../types';

export const resumeApi = {
  uploadResume: async (
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<ResumeUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<ResumeUploadResponse>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  },

  listResumes: async (): Promise<ResumeListResponse> => {
    const response = await axiosClient.get<ResumeListResponse>('/resumes');
    return response.data;
  },

  getResume: async (id: string): Promise<ResumeDetailResponse> => {
    const response = await axiosClient.get<ResumeDetailResponse>(`/resumes/${id}`);
    return response.data;
  },

  deleteResume: async (id: string): Promise<ApiResponse> => {
    const response = await axiosClient.delete<ApiResponse>(`/resumes/${id}`);
    return response.data;
  },
};

export default resumeApi;
