export interface DailySummaryDto {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  totalCost: number;
  stockPurchaseCost: number;
  otherExpenses: number;
  grossProfit: number;
  orderCount: number;
}

export interface ReportRangeDto {
  from: string;
  to: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  totalCost: number;
  stockPurchaseCost: number;
  otherExpenses: number;
  grossProfit: number;
  totalOrders: number;
  dailySummaries: DailySummaryDto[];
}
