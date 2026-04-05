export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPassword: string;
}

export interface TenantModuleDto {
  moduleId: number;
  moduleName: string;
  isActive: boolean;
  grantedByAdmin: boolean;
  startsAt: string;
  expiresAt: string | null;
}

export interface AssignModuleRequest {
  moduleId: number;
  expiresAt?: string;
  grantedByAdmin?: boolean;
}
