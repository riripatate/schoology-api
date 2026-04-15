import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { SessionCookies } from './headless-login.js'

const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex')
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(text: string, keyHex: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex!, 'hex')
  const encrypted = Buffer.from(encryptedHex!, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

const memoryStore = new Map<string, SessionCookies>()

export function storeSession(key: string, session: SessionCookies): void {
  memoryStore.set(key, session)
}

export function getSession(key: string): SessionCookies | undefined {
  return memoryStore.get(key)
}

export function clearSession(key: string): void {
  memoryStore.delete(key)
}

export function persistSession(
  session: SessionCookies,
  filePath: string,
  encryptionKey: string
): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const json = JSON.stringify(session)
  writeFileSync(filePath, encrypt(json, encryptionKey), 'utf8')
}

export function loadPersistedSession(
  filePath: string,
  encryptionKey: string
): SessionCookies | null {
  if (!existsSync(filePath)) return null
  try {
    const encrypted = readFileSync(filePath, 'utf8')
    return JSON.parse(decrypt(encrypted, encryptionKey)) as SessionCookies
  } catch {
    return null
  }
}
