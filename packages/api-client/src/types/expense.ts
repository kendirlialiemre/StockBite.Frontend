export interface ExpenseDto {
  id: string;
  amount: number;
  category: number;
  categoryLabel: string;
  description: string;
  date: string;
}

export interface CreateExpenseRequest {
  amount: number;
  category: number;
  description: string;
  date: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 0, label: 'Personel / Maaş' },
  { value: 1, label: 'Kira' },
  { value: 2, label: 'Bakım / Onarım' },
  { value: 3, label: 'Faturalar' },
  { value: 4, label: 'Diğer' },
] as const;
