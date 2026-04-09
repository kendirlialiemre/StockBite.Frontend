export interface DailySummaryDto {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  subscriptionRevenue: number;
  totalCost: number;
  stockPurchaseCost: number;
  otherExpenses: number;
  grossProfit: number;
  orderCount: number;
  tableCount: number;
}

export interface TopProductDto {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ReportRangeDto {
  from: string;
  to: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  subscriptionRevenue: number;
  totalCost: number;
  stockPurchaseCost: number;
  otherExpenses: number;
  grossProfit: number;
  totalOrders: number;
  dailySummaries: DailySummaryDto[];
  topProducts: TopProductDto[];
}
