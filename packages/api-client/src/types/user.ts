export interface EmployeeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Owner' | 'Employee';
  isActive: boolean;
  permissions: string[];
}

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UpdatePermissionsRequest {
  permissions: string[];
}
