import { apiClient } from '../client';
import type { DailySummaryDto, ReportRangeDto } from '../types/profitloss';

export const profitLossService = {
  async getDailySummary(date: string): Promise<DailySummaryDto> {
    const { data } = await apiClient.get<DailySummaryDto>(
      '/reports/daily',
      { params: { date } }
    );
    return data;
  },

  async getReportRange(from: string, to: string): Promise<ReportRangeDto> {
    const { data } = await apiClient.get<ReportRangeDto>('/reports/range', {
      params: { from, to },
    });
    return data;
  },

  async getSummary(
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<ReportRangeDto> {
    const { data } = await apiClient.get<ReportRangeDto>(
      '/reports/summary',
      { params: { period } }
    );
    return data;
  },
};
