import { apiClient, clearAuthTokens } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  UserDto,
  UpdateProfileRequest,
} from '../types/auth';

export const authService = {
  async login(req: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', req);
    return data;
  },

  async refreshToken(req: RefreshTokenRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/refresh',
      req
    );
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuthTokens();
    }
  },

  async getMe(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>('/auth/me');
    return data;
  },

  async getMyModules(): Promise<number[]> {
    const { data } = await apiClient.get<number[]>('/me/modules');
    return data;
  },

  async updateProfile(req: UpdateProfileRequest): Promise<void> {
    await apiClient.patch('/me/profile', req);
  },
};
