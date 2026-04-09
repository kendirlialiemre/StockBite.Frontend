export interface TableDto {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface TableWithOrderDto {
  id: string;
  name: string;
  orderId: string | null;
  total: number;
  itemCount: number;
  openedAt: string;
}

export type OrderStatus = 0 | 1 | 2; // Open | Closed | Cancelled

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note: string | null;
}

export interface OrderDto {
  id: string;
  tableId: string | null;
  tableName: string | null;
  status: OrderStatus;
  openedAt: string;
  closedAt: string | null;
  totalAmount: number;
  paymentMethod: 0 | 1 | 2 | null;
  cashAmount: number | null;
  cardAmount: number | null;
  items: OrderItemDto[];
}

export interface CreateOrderRequest {
  tableId?: string;
  note?: string;
}

export interface AddOrderItemRequest {
  menuItemId: string;
  quantity: number;
  note?: string;
}
