import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../src/http/client.js'
import { server, mockDomain } from './setup.js'
import { http, HttpResponse } from 'msw'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test-session', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(),
  domain: mockDomain,
}

describe('SchoologyHttpClient', () => {
  let client: SchoologyHttpClient

  beforeEach(() => {
    client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
  })

  it('fetches current user', async () => {
    const user = await client.get<{ name_first: string }>('/users/me')
    expect(user.name_first).toBe('Test')
  })

  it('fetches sections', async () => {
    const res = await client.get<{ section: unknown[] }>('/users/me/sections')
    expect(res.section).toHaveLength(2)
  })

  it('auto-retries on 401 with session refresh', async () => {
    let reauthed = false
    const retriableClient = new SchoologyHttpClient(mockDomain, {
      onSessionExpired: async () => {
        reauthed = true
        return mockSession
      },
    })
    retriableClient.setSession(mockSession)

    let called = 0
    server.use(
      http.get(`https://${mockDomain}/api/v1/users/me`, () => {
        called++
        if (called === 1) return HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
        return HttpResponse.json({ name_first: 'Test' })
      })
    )

    const user = await retriableClient.get<{ name_first: string }>('/users/me')
    expect(user.name_first).toBe('Test')
    expect(reauthed).toBe(true)
  })

  it('throws normalized error on non-401 HTTP errors', async () => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/users/me`, () =>
        HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 })
      )
    )
    await expect(client.get('/users/me')).rejects.toThrow('Schoology API error 404')
  })
})
