import axiosClient from './axiosClient';
import type {
  CreateAnalysisInput,
  AnalysisResponse,
  AnalysisListResponse,
  CreateJobInput,
  JobResponse,
  JobListResponse,
  ApiResponse,
} from '../../types';

export const analysisApi = {
  createAnalysis: async (data: CreateAnalysisInput): Promise<AnalysisResponse> => {
    const response = await axiosClient.post<AnalysisResponse>('/analysis', data);
    return response.data;
  },

  listAnalyses: async (): Promise<AnalysisListResponse> => {
    const response = await axiosClient.get<AnalysisListResponse>('/analysis');
    return response.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisResponse> => {
    const response = await axiosClient.get<AnalysisResponse>(`/analysis/${id}`);
    return response.data;
  },

  deleteAnalysis: async (id: string): Promise<ApiResponse> => {
    const response = await axiosClient.delete<ApiResponse>(`/analysis/${id}`);
    return response.data;
  },

  downloadReport: async (id: string, originalFileName?: string): Promise<void> => {
    const response = await axiosClient.get(`/analysis/${id}/report`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const cleanName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'resume';
    link.download = `AI-Resume-Analysis-${cleanName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  createJobDescription: async (data: CreateJobInput): Promise<JobResponse> => {
    const response = await axiosClient.post<JobResponse>('/job-descriptions', data);
    return response.data;
  },

  listJobDescriptions: async (): Promise<JobListResponse> => {
    const response = await axiosClient.get<JobListResponse>('/job-descriptions');
    return response.data;
  },
};

export default analysisApi;
