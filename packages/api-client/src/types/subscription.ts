export type PaymentStatus = 0 | 1 | 2 | 3 | 4; // Pending | Success | Failed | Cancelled | Free

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  tenantName: string;
  userName: string;
  userEmail: string;
  packageName: string;
  amount: number;
  status: PaymentStatus;
  purchasedAt: string;
  expiresAt: string | null;
}

export interface MyPaymentDto {
  id: string;
  packageName: string;
  packageDescription: string;
  amount: number;
  status: PaymentStatus;
  purchasedAt: string;
  expiresAt: string | null;
}

export interface GrantPackageRequest {
  tenantId: string;
  packageId: string;
  expiresAt?: string;
}
