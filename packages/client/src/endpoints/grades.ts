import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyGradeReport } from '../types/index.js'

export class GradesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getMyGrades(): Promise<SchoologyGradeReport[]> {
    const res = await this.http.get<{ section: SchoologyGradeReport[] }>('/users/me/grades')
    return res.section ?? []
  }

  async getSectionGrades(sectionId: string): Promise<SchoologyGradeReport> {
    return this.http.get<SchoologyGradeReport>(`/sections/${sectionId}/grades`)
  }

  async updateGrade(
    sectionId: string,
    assignmentId: string,
    enrollmentId: string,
    grade: string,
    comment?: string
  ): Promise<void> {
    await this.http.put(`/sections/${sectionId}/grades`, {
      grades: { grade: [{ assignment_id: assignmentId, enrollment_id: enrollmentId, grade, comment }] },
    })
  }
}
