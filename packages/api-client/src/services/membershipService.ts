import { apiClient } from '../client';
import type {
  MemberDto,
  MemberDetailDto,
  SubscriptionDto,
  SessionDto,
  CreateMemberRequest,
  CreateSubscriptionRequest,
  RecordSessionRequest,
} from '../types/membership';

export const membershipService = {
  async getMembers(search?: string): Promise<MemberDto[]> {
    const { data } = await apiClient.get<MemberDto[]>('/memberships/members', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async getMemberDetail(memberId: string): Promise<MemberDetailDto> {
    const { data } = await apiClient.get<MemberDetailDto>(`/memberships/members/${memberId}`);
    return data;
  },

  async createMember(req: CreateMemberRequest): Promise<MemberDto> {
    const { data } = await apiClient.post<MemberDto>('/memberships/members', req);
    return data;
  },

  async deleteMember(memberId: string): Promise<void> {
    await apiClient.delete(`/memberships/members/${memberId}`);
  },

  async createSubscription(req: CreateSubscriptionRequest): Promise<SubscriptionDto> {
    const { data } = await apiClient.post<SubscriptionDto>('/memberships/subscriptions', req);
    return data;
  },

  async updateSubscription(subscriptionId: string, req: { totalHours: number; price: number; note?: string }): Promise<SubscriptionDto> {
    const { data } = await apiClient.put<SubscriptionDto>(`/memberships/subscriptions/${subscriptionId}`, req);
    return data;
  },

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await apiClient.delete(`/memberships/subscriptions/${subscriptionId}`);
  },

  async recordSession(req: RecordSessionRequest): Promise<SessionDto> {
    const { data } = await apiClient.post<SessionDto>('/memberships/sessions', req);
    return data;
  },

  async updateSession(sessionId: string, req: { hours: number; note?: string }): Promise<SessionDto> {
    const { data } = await apiClient.put<SessionDto>(`/memberships/sessions/${sessionId}`, req);
    return data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/memberships/sessions/${sessionId}`);
  },
};
