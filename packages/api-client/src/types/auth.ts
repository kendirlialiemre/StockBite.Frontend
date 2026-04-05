export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SuperAdmin' | 'Owner' | 'Employee';
  tenantId: string | null;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  currentPassword?: string;
  newPassword?: string;
}
