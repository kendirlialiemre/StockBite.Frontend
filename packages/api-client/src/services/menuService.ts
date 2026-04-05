import { apiClient } from '../client';
import type {
  MenuCategoryDto,
  MenuItemDto,
  MenuQrCodeDto,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
} from '../types/menu';

export const menuService = {
  // Categories
  async getCategories(): Promise<MenuCategoryDto[]> {
    const { data } = await apiClient.get<MenuCategoryDto[]>(
      '/menu/categories'
    );
    return data;
  },

  async createCategory(
    name: string,
    displayOrder?: number
  ): Promise<MenuCategoryDto> {
    const { data } = await apiClient.post<MenuCategoryDto>(
      '/menu/categories',
      { name, displayOrder }
    );
    return data;
  },

  async updateCategory(
    id: string,
    patch: Partial<Pick<MenuCategoryDto, 'name' | 'displayOrder' | 'isActive'>>
  ): Promise<MenuCategoryDto> {
    const { data } = await apiClient.patch<MenuCategoryDto>(
      `/menu/categories/${id}`,
      patch
    );
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/menu/categories/${id}`);
  },

  // Items
  async getItems(categoryId?: string): Promise<MenuItemDto[]> {
    const { data } = await apiClient.get<MenuItemDto[]>('/menu/items', {
      params: categoryId ? { categoryId } : undefined,
    });
    return data;
  },

  async getItemById(id: string): Promise<MenuItemDto> {
    const { data } = await apiClient.get<MenuItemDto>(`/menu/items/${id}`);
    return data;
  },

  async createItem(req: CreateMenuItemRequest): Promise<MenuItemDto> {
    const { data } = await apiClient.post<MenuItemDto>('/menu/items', req);
    return data;
  },

  async updateItem(
    id: string,
    req: UpdateMenuItemRequest
  ): Promise<MenuItemDto> {
    const { data } = await apiClient.patch<MenuItemDto>(
      `/menu/items/${id}`,
      req
    );
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/menu/items/${id}`);
  },

  async toggleItemAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<MenuItemDto> {
    const { data } = await apiClient.patch<MenuItemDto>(
      `/menu/items/${id}`,
      { isAvailable }
    );
    return data;
  },

  // QR Codes
  async getQrCodes(): Promise<MenuQrCodeDto[]> {
    const { data } = await apiClient.get<MenuQrCodeDto[]>('/menu/qr-codes');
    return data;
  },

  async createQrCode(label: string, baseUrl: string): Promise<MenuQrCodeDto> {
    const { data } = await apiClient.post<MenuQrCodeDto>('/menu/qr-codes', { label, baseUrl });
    return data;
  },

  async deleteQrCode(id: string): Promise<void> {
    await apiClient.delete(`/menu/qr-codes/${id}`);
  },

  async regenerateQrCode(id: string, baseUrl: string): Promise<MenuQrCodeDto> {
    const { data } = await apiClient.post<MenuQrCodeDto>(`/menu/qr-codes/${id}/regenerate`, { baseUrl });
    return data;
  },

  // Settings
  async getMenuSettings(): Promise<{ qrMenuTemplate: number; logoUrl: string | null; primaryColor: string; bgColor: string; textColor: string; fontFamily: string }> {
    const { data } = await apiClient.get('/menu/settings');
    return data;
  },

  async saveMenuDesign(design: { qrMenuTemplate?: number; primaryColor?: string; bgColor?: string; textColor?: string; fontFamily?: string }): Promise<void> {
    await apiClient.patch('/menu/settings', design);
  },

  async getQrCodeDesign(qrId: string): Promise<{ qrMenuTemplate: number; primaryColor: string; bgColor: string; textColor: string; fontFamily: string; logoUrl: string | null }> {
    const { data } = await apiClient.get(`/menu/qr-codes/${qrId}/design`);
    return data;
  },

  async saveQrCodeDesign(qrId: string, design: { qrMenuTemplate?: number; primaryColor?: string; bgColor?: string; textColor?: string; fontFamily?: string }): Promise<void> {
    await apiClient.patch(`/menu/qr-codes/${qrId}/design`, design);
  },

  async uploadQrLogo(qrId: string, file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ logoUrl: string }>(`/menu/qr-codes/${qrId}/design/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ logoUrl: string }>('/menu/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
