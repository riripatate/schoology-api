import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyMessage } from '../types/index.js'

export class MessagesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listInbox(): Promise<SchoologyMessage[]> {
    const res = await this.http.get<{ message: SchoologyMessage[] }>('/messages/inbox')
    return res.message ?? []
  }

  async listSent(): Promise<SchoologyMessage[]> {
    const res = await this.http.get<{ message: SchoologyMessage[] }>('/messages/sent')
    return res.message ?? []
  }

  async getMessage(messageId: string): Promise<SchoologyMessage> {
    return this.http.get<SchoologyMessage>(`/messages/inbox/${messageId}`)
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.http.delete(`/messages/inbox/${messageId}`)
  }
}
