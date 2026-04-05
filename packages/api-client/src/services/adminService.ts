import { apiClient } from '../client';
import type {
  TenantDto,
  CreateTenantRequest,
  TenantModuleDto,
  AssignModuleRequest,
} from '../types/tenant';
import type { SubscriptionDto, GrantPackageRequest } from '../types/subscription';

export const adminService = {
  async getTenants(): Promise<TenantDto[]> {
    const { data } = await apiClient.get<TenantDto[]>('/admin/tenants');
    return data;
  },

  async createTenant(req: CreateTenantRequest): Promise<TenantDto> {
    const { data } = await apiClient.post<TenantDto>('/admin/tenants', req);
    return data;
  },

  async getTenantById(id: string): Promise<TenantDto> {
    const { data } = await apiClient.get<TenantDto>(`/admin/tenants/${id}`);
    return data;
  },

  async updateTenant(
    id: string,
    patch: Partial<Pick<TenantDto, 'name' | 'slug' | 'isActive'>>
  ): Promise<TenantDto> {
    const { data } = await apiClient.patch<TenantDto>(
      `/admin/tenants/${id}`,
      patch
    );
    return data;
  },

  async getTenantModules(tenantId: string): Promise<TenantModuleDto[]> {
    const { data } = await apiClient.get<TenantModuleDto[]>(
      `/admin/tenants/${tenantId}/modules`
    );
    return data;
  },

  async assignModule(
    tenantId: string,
    req: AssignModuleRequest
  ): Promise<TenantModuleDto> {
    const { data } = await apiClient.post<TenantModuleDto>(
      `/admin/tenants/${tenantId}/modules`,
      req
    );
    return data;
  },

  async revokeModule(tenantId: string, moduleId: number): Promise<void> {
    await apiClient.delete(
      `/admin/tenants/${tenantId}/modules/${moduleId}`
    );
  },

  // Subscriptions
  async getSubscriptions(tenantId?: string): Promise<SubscriptionDto[]> {
    const { data } = await apiClient.get<SubscriptionDto[]>('/admin/subscriptions', {
      params: tenantId ? { tenantId } : undefined,
    });
    return data;
  },

  async grantPackage(req: GrantPackageRequest): Promise<void> {
    await apiClient.post('/admin/subscriptions/grant', req);
  },
};
