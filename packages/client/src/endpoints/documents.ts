import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyDocument } from '../types/index.js'

export class DocumentsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listDocuments(sectionId: string): Promise<SchoologyDocument[]> {
    const res = await this.http.get<{ document: SchoologyDocument[] }>(
      `/sections/${sectionId}/documents`
    )
    return res.document ?? []
  }

  async getDocument(sectionId: string, documentId: string): Promise<SchoologyDocument> {
    return this.http.get<SchoologyDocument>(`/sections/${sectionId}/documents/${documentId}`)
  }
}
