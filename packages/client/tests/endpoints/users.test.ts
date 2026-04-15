import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { UsersEndpoint } from '../../src/endpoints/users.js'
import { mockDomain } from '../setup.js'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(),
  domain: mockDomain,
}

describe('UsersEndpoint', () => {
  let endpoint: UsersEndpoint

  beforeEach(() => {
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new UsersEndpoint(client)
  })

  it('getMe returns the current user', async () => {
    const me = await endpoint.getMe()
    expect(me.name_first).toBe('Test')
    expect(me.name_last).toBe('Student')
  })

  it('getMySections returns array of sections', async () => {
    const sections = await endpoint.getMySections()
    expect(sections).toHaveLength(2)
    expect(sections[0]?.course_title).toBe('Math 101')
  })
})
