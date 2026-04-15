import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyCourse } from '../types/index.js'

export class CoursesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getCourse(courseId: string): Promise<SchoologyCourse> {
    return this.http.get<SchoologyCourse>(`/courses/${courseId}`)
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.http.delete(`/courses/${courseId}`)
  }
}
