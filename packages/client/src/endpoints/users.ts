import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyUser, SchoologySection } from '../types/index.js'

export class UsersEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getMe(): Promise<SchoologyUser> {
    return this.http.get<SchoologyUser>('/users/me')
  }

  async getUser(userId: string): Promise<SchoologyUser> {
    return this.http.get<SchoologyUser>(`/users/${userId}`)
  }

  async getMySections(): Promise<SchoologySection[]> {
    const res = await this.http.get<{ section: SchoologySection[] }>('/users/me/sections')
    return res.section ?? []
  }

  async updateUser(
    userId: string,
    data: Partial<Pick<SchoologyUser, 'name_first' | 'name_last' | 'bio' | 'position'>>
  ): Promise<void> {
    await this.http.put(`/users/${userId}`, data)
  }
}
