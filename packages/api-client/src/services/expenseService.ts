import { apiClient } from '../client';
import type { ExpenseDto, CreateExpenseRequest } from '../types/expense';

export const expenseService = {
  async getExpenses(from?: string, to?: string): Promise<ExpenseDto[]> {
    const { data } = await apiClient.get<ExpenseDto[]>('/expenses', {
      params: { from, to },
    });
    return data;
  },

  async createExpense(req: CreateExpenseRequest): Promise<ExpenseDto> {
    const { data } = await apiClient.post<ExpenseDto>('/expenses', req);
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
};
