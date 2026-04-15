import { describe, it, expect, afterEach } from 'vitest'
import { existsSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  storeSession, getSession, clearSession,
  persistSession, loadPersistedSession,
} from '../src/auth/session-store.js'
import type { SessionCookies } from '../src/auth/headless-login.js'

const mockSession: SessionCookies = {
  cookies: [{ name: 'PHPSESSID', value: 'abc', domain: 'test.schoology.com', path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' }],
  capturedAt: Date.now(),
  domain: 'test.schoology.com',
}
const TEST_KEY = 'a'.repeat(64)
const TEST_PATH = join(tmpdir(), 'schoology-test-session.enc')

afterEach(() => {
  clearSession('test-key')
  if (existsSync(TEST_PATH)) unlinkSync(TEST_PATH)
})

describe('in-memory session store', () => {
  it('stores and retrieves a session', () => {
    storeSession('test-key', mockSession)
    expect(getSession('test-key')).toEqual(mockSession)
  })

  it('returns undefined for unknown key', () => {
    expect(getSession('missing')).toBeUndefined()
  })

  it('clears a session', () => {
    storeSession('test-key', mockSession)
    clearSession('test-key')
    expect(getSession('test-key')).toBeUndefined()
  })
})

describe('disk persistence', () => {
  it('persists and loads a session', () => {
    persistSession(mockSession, TEST_PATH, TEST_KEY)
    const loaded = loadPersistedSession(TEST_PATH, TEST_KEY)
    expect(loaded).toMatchObject({ domain: 'test.schoology.com' })
    expect(loaded?.cookies[0]?.value).toBe('abc')
  })

  it('returns null if file does not exist', () => {
    expect(loadPersistedSession('/nonexistent/path.enc', TEST_KEY)).toBeNull()
  })

  it('returns null if encryption key is wrong', () => {
    persistSession(mockSession, TEST_PATH, TEST_KEY)
    expect(loadPersistedSession(TEST_PATH, 'b'.repeat(64))).toBeNull()
  })
})
