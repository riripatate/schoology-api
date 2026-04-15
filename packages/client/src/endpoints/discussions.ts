import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyDiscussion } from '../types/index.js'

export class DiscussionsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listDiscussions(sectionId: string): Promise<SchoologyDiscussion[]> {
    const res = await this.http.get<{ discussion: SchoologyDiscussion[] }>(
      `/sections/${sectionId}/discussions`
    )
    return res.discussion ?? []
  }

  async getDiscussion(sectionId: string, discussionId: string): Promise<SchoologyDiscussion> {
    return this.http.get<SchoologyDiscussion>(
      `/sections/${sectionId}/discussions/${discussionId}`
    )
  }

  async updateDiscussion(
    sectionId: string,
    discussionId: string,
    data: Partial<Pick<SchoologyDiscussion, 'title' | 'body'>>
  ): Promise<void> {
    await this.http.put(`/sections/${sectionId}/discussions/${discussionId}`, data)
  }

  async deleteDiscussion(sectionId: string, discussionId: string): Promise<void> {
    await this.http.delete(`/sections/${sectionId}/discussions/${discussionId}`)
  }
}
