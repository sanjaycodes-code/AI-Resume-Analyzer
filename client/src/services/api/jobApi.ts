import axiosClient from './axiosClient';
import type {
  CreateJobInput,
  JobResponse,
  JobListResponse,
  ApiResponse,
} from '../../types';

export const jobApi = {
  createJobDescription: async (data: CreateJobInput): Promise<JobResponse> => {
    const response = await axiosClient.post<JobResponse>('/job-descriptions', data);
    return response.data;
  },

  listJobDescriptions: async (): Promise<JobListResponse> => {
    const response = await axiosClient.get<JobListResponse>('/job-descriptions');
    return response.data;
  },

  getJobDescription: async (id: string): Promise<JobResponse> => {
    const response = await axiosClient.get<JobResponse>(`/job-descriptions/${id}`);
    return response.data;
  },

  deleteJobDescription: async (id: string): Promise<ApiResponse> => {
    const response = await axiosClient.delete<ApiResponse>(`/job-descriptions/${id}`);
    return response.data;
  },
};

export default jobApi;
