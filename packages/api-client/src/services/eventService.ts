import { apiClient } from '../client';
import type { EventDto, CreateEventRequest, UpdateEventRequest, TakeEventPaymentRequest } from '../types/event';

export const eventService = {
  async getAll(year?: number, month?: number): Promise<EventDto[]> {
    const { data } = await apiClient.get<EventDto[]>('/events', {
      params: { year, month },
    });
    return data;
  },

  async create(req: CreateEventRequest): Promise<EventDto> {
    const { data } = await apiClient.post<EventDto>('/events', req);
    return data;
  },

  async update(id: string, req: UpdateEventRequest): Promise<EventDto> {
    const { data } = await apiClient.put<EventDto>(`/events/${id}`, req);
    return data;
  },

  async takePayment(id: string, req: TakeEventPaymentRequest): Promise<EventDto> {
    const { data } = await apiClient.post<EventDto>(`/events/${id}/payment`, req);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },
};
