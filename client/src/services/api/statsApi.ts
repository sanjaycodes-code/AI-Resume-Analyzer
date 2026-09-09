import axiosClient from './axiosClient';

export interface PublicStats {
  totalResumes: number;
  totalAnalyses: number;
}

export interface PublicStatsResponse {
  success: boolean;
  data: PublicStats;
}

export const statsApi = {
  getPublicStats: async (): Promise<PublicStats> => {
    const response = await axiosClient.get<PublicStatsResponse>('/stats');
    return response.data.data;
  },
};

export default statsApi;
