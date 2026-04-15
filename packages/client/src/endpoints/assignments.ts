import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyAssignment } from '../types/index.js'

export class AssignmentsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listAssignments(sectionId: string): Promise<SchoologyAssignment[]> {
    const res = await this.http.get<{ assignment: SchoologyAssignment[] }>(
      `/sections/${sectionId}/assignments`
    )
    return res.assignment ?? []
  }

  async getAssignment(sectionId: string, assignmentId: string): Promise<SchoologyAssignment> {
    return this.http.get<SchoologyAssignment>(
      `/sections/${sectionId}/assignments/${assignmentId}`
    )
  }

  async updateAssignment(
    sectionId: string,
    assignmentId: string,
    data: Partial<Pick<SchoologyAssignment, 'title' | 'description' | 'due' | 'max_points'>>
  ): Promise<void> {
    await this.http.put(`/sections/${sectionId}/assignments/${assignmentId}`, data)
  }

  async deleteAssignment(sectionId: string, assignmentId: string): Promise<void> {
    await this.http.delete(`/sections/${sectionId}/assignments/${assignmentId}`)
  }
}
