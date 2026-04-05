export interface StockItemDto {
  id: string;
  categoryId: string | null;
  name: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number | null;
  unitCost: number | null;
}

export type StockMovementType = 0 | 1 | 2; // StockIn | StockOut | Adjustment

export interface StockMovementDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number | null;
  note: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateStockMovementRequest {
  stockItemId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  note?: string;
  lowStockThreshold?: number;
}
