import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyEvent } from '../types/index.js'

export class EventsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listMyEvents(options?: {
    start_date?: string
    end_date?: string
  }): Promise<SchoologyEvent[]> {
    const res = await this.http.get<{ event: SchoologyEvent[] }>('/users/me/events', options)
    return res.event ?? []
  }

  async listSectionEvents(sectionId: string): Promise<SchoologyEvent[]> {
    const res = await this.http.get<{ event: SchoologyEvent[] }>(`/sections/${sectionId}/events`)
    return res.event ?? []
  }

  async getEvent(eventId: string): Promise<SchoologyEvent> {
    return this.http.get<SchoologyEvent>(`/events/${eventId}`)
  }

  async updateEvent(
    eventId: string,
    data: Partial<Pick<SchoologyEvent, 'title' | 'description' | 'start' | 'end'>>
  ): Promise<void> {
    await this.http.put(`/events/${eventId}`, data)
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.http.delete(`/events/${eventId}`)
  }
}
