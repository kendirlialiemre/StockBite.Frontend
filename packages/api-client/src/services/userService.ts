import { apiClient } from '../client';
import type {
  EmployeeDto,
  CreateEmployeeRequest,
  UpdatePermissionsRequest,
} from '../types/user';

export const userService = {
  async getEmployees(): Promise<EmployeeDto[]> {
    const { data } = await apiClient.get<EmployeeDto[]>('/users/employees');
    return data;
  },

  async createEmployee(req: CreateEmployeeRequest): Promise<EmployeeDto> {
    const { data } = await apiClient.post<EmployeeDto>(
      '/users/employees',
      req
    );
    return data;
  },

  async updateEmployee(
    id: string,
    patch: Partial<Pick<EmployeeDto, 'firstName' | 'lastName' | 'isActive'>>
  ): Promise<EmployeeDto> {
    const { data } = await apiClient.patch<EmployeeDto>(
      `/users/employees/${id}`,
      patch
    );
    return data;
  },

  async getPermissions(userId: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(
      `/users/${userId}/permissions`
    );
    return data;
  },

  async updatePermissions(
    userId: string,
    req: UpdatePermissionsRequest
  ): Promise<EmployeeDto> {
    const { data } = await apiClient.put<EmployeeDto>(
      `/users/${userId}/permissions`,
      req
    );
    return data;
  },
};
