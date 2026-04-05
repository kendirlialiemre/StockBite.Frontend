export interface MenuCategoryDto {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItemIngredientDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  unit: string;
  quantity: number;
  unitCost: number | null;
}

export interface MenuItemDto {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  description: string;
  price: number;
  costPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  ingredients: MenuItemIngredientDto[];
  calculatedCost: number | null;
  estimatedProfit: number | null;
}

export interface IngredientRequest {
  stockItemId: string;
  quantity: number;
}

export interface CreateMenuItemRequest {
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  ingredients?: IngredientRequest[];
}

export interface MenuQrCodeDto {
  id: string;
  label: string;
  filePath: string;
  publicUrl: string;
  createdAt: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  categoryId?: string;
  isAvailable?: boolean;
  ingredients?: IngredientRequest[];
}
