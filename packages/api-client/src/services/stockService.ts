import { apiClient } from '../client';
import type {
  StockItemDto,
  StockMovementDto,
  PagedResult,
  CreateStockMovementRequest,
} from '../types/stock';

export const stockService = {
  // Stock Items
  async getStockItems(): Promise<StockItemDto[]> {
    const { data } = await apiClient.get<StockItemDto[]>('/stock/items');
    return data;
  },

  async getStockItemById(id: string): Promise<StockItemDto> {
    const { data } = await apiClient.get<StockItemDto>(`/stock/items/${id}`);
    return data;
  },

  async createStockItem(item: {
    name: string;
    unit: string;
    initialQuantity?: number;
    unitCost?: number;
    lowStockThreshold?: number;
    categoryId?: string;
  }): Promise<StockItemDto> {
    const { data } = await apiClient.post<StockItemDto>('/stock/items', item);
    return data;
  },

  async updateStockItem(
    id: string,
    patch: Partial<{
      name: string;
      unit: string;
      unitCost: number;
      lowStockThreshold: number;
      categoryId: string;
    }>
  ): Promise<StockItemDto> {
    const { data } = await apiClient.patch<StockItemDto>(
      `/stock/items/${id}`,
      patch
    );
    return data;
  },

  async deleteStockItem(id: string): Promise<void> {
    await apiClient.delete(`/stock/items/${id}`);
  },

  // Stock Movements
  async getMovements(params?: {
    stockItemId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<StockMovementDto>> {
    const { data } = await apiClient.get<PagedResult<StockMovementDto>>(
      '/stock/movements',
      { params }
    );
    return data;
  },

  async createMovement(
    req: CreateStockMovementRequest
  ): Promise<StockMovementDto> {
    const { data } = await apiClient.post<StockMovementDto>(
      '/stock/movements',
      req
    );
    return data;
  },
};
