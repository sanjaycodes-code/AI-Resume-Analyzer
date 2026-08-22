import axiosClient from './axiosClient';
import type { ApiResponse } from '../../types';

export interface EnhanceBulletResult {
  enhancedText: string;
  changesSummary: string[];
  createdAt?: string;
}

export const enhancerApi = {
  enhanceBullet: async (
    analysisId: string,
    originalText: string,
    targetRole?: string
  ): Promise<ApiResponse<EnhanceBulletResult>> => {
    const response = await axiosClient.post<ApiResponse<EnhanceBulletResult>>('/analysis/enhance-bullet', {
      analysisId,
      originalText,
      targetRole: targetRole?.trim() || undefined,
    });
    return response.data;
  },
};

export default enhancerApi;
