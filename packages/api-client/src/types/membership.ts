export interface MemberDto {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  subscriptionCount: number;
  totalRemainingHours: number;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  hours: number;
  note?: string;
  sessionAt: string;
}

export interface SubscriptionDto {
  id: string;
  totalHours: number;
  remainingHours: number;
  price: number;
  note?: string;
  purchasedAt: string;
  sessions: SessionDto[];
}

export interface MemberDetailDto {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  createdAt: string;
  subscriptions: SubscriptionDto[];
}

export interface CreateMemberRequest {
  name: string;
  phone?: string;
  note?: string;
}

export interface CreateSubscriptionRequest {
  memberId: string;
  totalHours: number;
  price: number;
  note?: string;
}

export interface RecordSessionRequest {
  subscriptionId: string;
  hours: number;
  note?: string;
}
