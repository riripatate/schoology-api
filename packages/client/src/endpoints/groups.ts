import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyGroup } from '../types/index.js'

export class GroupsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listMyGroups(): Promise<SchoologyGroup[]> {
    const res = await this.http.get<{ group: SchoologyGroup[] }>('/groups')
    return res.group ?? []
  }

  async getGroup(groupId: string): Promise<SchoologyGroup> {
    return this.http.get<SchoologyGroup>(`/groups/${groupId}`)
  }
}
