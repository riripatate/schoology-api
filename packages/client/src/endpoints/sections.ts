import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologySection } from '../types/index.js'

export class SectionsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getSection(sectionId: string): Promise<SchoologySection> {
    return this.http.get<SchoologySection>(`/sections/${sectionId}`)
  }

  async listSectionEnrollments(
    sectionId: string
  ): Promise<{ uid: string; type: string; status: number; admin: number }[]> {
    const res = await this.http.get<{
      enrollment: { uid: string; type: string; status: number; admin: number }[]
    }>(`/sections/${sectionId}/enrollments`)
    return res.enrollment ?? []
  }

  async updateSection(
    sectionId: string,
    data: Partial<Pick<SchoologySection, 'section_title' | 'description' | 'location'>>
  ): Promise<void> {
    await this.http.put(`/sections/${sectionId}`, data)
  }
}
