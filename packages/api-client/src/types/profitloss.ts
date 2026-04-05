export interface DailySummaryDto {
  date: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  orderCount: number;
}

export interface ReportRangeDto {
  from: string;
  to: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalOrders: number;
  dailySummaries: DailySummaryDto[];
}
