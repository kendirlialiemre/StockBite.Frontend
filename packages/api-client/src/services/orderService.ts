import { apiClient } from '../client';
import type {
  TableDto,
  TableWithOrderDto,
  OrderDto,
  CreateOrderRequest,
  AddOrderItemRequest,
} from '../types/order';

export const orderService = {
  // Active tables (with open order info)
  async getActiveTables(): Promise<TableWithOrderDto[]> {
    const { data } = await apiClient.get<TableWithOrderDto[]>('/tables');
    return data;
  },

  async openTable(name: string): Promise<TableWithOrderDto> {
    const { data } = await apiClient.post<TableWithOrderDto>('/tables', { name });
    return data;
  },

  async getTableActiveOrder(tableId: string): Promise<OrderDto> {
    const { data } = await apiClient.get<OrderDto>(`/tables/${tableId}/order`);
    return data;
  },

  // Legacy table CRUD (kept for compatibility)
  async getTables(): Promise<TableDto[]> {
    const { data } = await apiClient.get<TableDto[]>('/tables');
    return data as unknown as TableDto[];
  },

  async createTable(name: string, capacity: number): Promise<TableDto> {
    const { data } = await apiClient.post<TableDto>('/tables', { name, capacity });
    return data;
  },

  // Orders
  async getOrders(params?: { status?: number; tableId?: string }): Promise<OrderDto[]> {
    const { data } = await apiClient.get<OrderDto[]>('/orders', { params });
    return data;
  },

  async getOrderById(id: string): Promise<OrderDto> {
    const { data } = await apiClient.get<OrderDto>(`/orders/${id}`);
    return data;
  },

  async createOrder(req: CreateOrderRequest): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>('/orders', req);
    return data;
  },

  async addOrderItem(orderId: string, req: AddOrderItemRequest): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(`/orders/${orderId}/items`, req);
    return data;
  },

  async removeOrderItem(orderId: string, itemId: string): Promise<OrderDto> {
    const { data } = await apiClient.delete<OrderDto>(`/orders/${orderId}/items/${itemId}`);
    return data;
  },

  async closeOrder(orderId: string, paymentMethod: 0 | 1): Promise<void> {
    await apiClient.post(`/orders/${orderId}/close`, { paymentMethod });
  },

  async cancelOrder(orderId: string): Promise<void> {
    await apiClient.post(`/orders/${orderId}/cancel`);
  },
};
