import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { GradesEndpoint } from '../../src/endpoints/grades.js'
import { mockDomain } from '../setup.js'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(),
  domain: mockDomain,
}

describe('GradesEndpoint', () => {
  let endpoint: GradesEndpoint

  beforeEach(() => {
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new GradesEndpoint(client)
  })

  it('getMyGrades returns sections with grades', async () => {
    const grades = await endpoint.getMyGrades()
    expect(grades).toHaveLength(1)
    expect(grades[0]?.period[0]?.calculated_grade).toBe('95')
    expect(grades[0]?.assignment[0]?.grade).toBe('92')
  })
})
