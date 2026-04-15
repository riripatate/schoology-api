import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { AssignmentsEndpoint } from '../../src/endpoints/assignments.js'
import { mockDomain } from '../setup.js'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(),
  domain: mockDomain,
}

describe('AssignmentsEndpoint', () => {
  let endpoint: AssignmentsEndpoint

  beforeEach(() => {
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new AssignmentsEndpoint(client)
  })

  it('lists assignments for a section', async () => {
    const assignments = await endpoint.listAssignments('s1')
    expect(assignments).toHaveLength(1)
    expect(assignments[0]?.title).toBe('Homework 1')
    expect(assignments[0]?.max_points).toBe(100)
  })
})
