import axiosClient from './axiosClient';
import type {
  AuthResponse,
  ForgotPasswordData,
  GenericAuthResponse,
  LoginData,
  MeResponse,
  RefreshResponse,
  RegisterData,
  ResetPasswordData,
} from '../../types/auth.types';

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<GenericAuthResponse> => {
    const response = await axiosClient.post<GenericAuthResponse>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<GenericAuthResponse> => {
    const response = await axiosClient.post<GenericAuthResponse>('/auth/reset-password', data);
    return response.data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    const response = await axiosClient.post<RefreshResponse>('/auth/refresh', {});
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post('/auth/logout', {});
  },

  me: async (): Promise<MeResponse> => {
    const response = await axiosClient.get<MeResponse>('/auth/me');
    return response.data;
  },
};

export default authApi;
