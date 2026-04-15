import { describe, it, expect } from 'vitest'
import { isSessionFresh } from '../src/auth/headless-login.js'
import type { SessionCookies } from '../src/auth/headless-login.js'

const makeMockSession = (capturedAt: number): SessionCookies => ({
  cookies: [
    {
      name: 'PHPSESSID',
      value: 'abc123',
      domain: 'test.schoology.com',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
  ],
  capturedAt,
  domain: 'test.schoology.com',
})

describe('isSessionFresh', () => {
  it('returns true for a session captured moments ago', () => {
    expect(isSessionFresh(makeMockSession(Date.now()))).toBe(true)
  })

  it('returns false for a session over 12 hours old', () => {
    expect(isSessionFresh(makeMockSession(Date.now() - 13 * 60 * 60 * 1000))).toBe(false)
  })

  it('returns true for a session exactly 11 hours old', () => {
    expect(isSessionFresh(makeMockSession(Date.now() - 11 * 60 * 60 * 1000))).toBe(true)
  })
})
