export type EventStatus = 0 | 1 | 2; // Planned | Completed | Cancelled
export type EventPaymentMethod = 0 | 1 | 2; // Cash | Card | Mixed

export interface EventDto {
  id: string;
  personName: string;
  age: number | null;
  eventDate: string; // YYYY-MM-DD
  adultCount: number;
  childCount: number;
  eventType: string;
  package: string | null;
  chargedAmount: number;
  cost: number;
  profit: number;
  notes: string | null;
  status: EventStatus;
  createdAt: string;
  paymentMethod: EventPaymentMethod | null;
  cashAmount: number;
  cardAmount: number;
  paidAt: string | null;
}

export interface TakeEventPaymentRequest {
  method: EventPaymentMethod;
  cashAmount: number;
  cardAmount: number;
}

export interface CreateEventRequest {
  personName: string;
  age?: number | null;
  eventDate: string;
  adultCount: number;
  childCount: number;
  eventType: string;
  package?: string | null;
  chargedAmount: number;
  cost: number;
  notes?: string | null;
}

export interface UpdateEventRequest extends CreateEventRequest {
  status: EventStatus;
}
