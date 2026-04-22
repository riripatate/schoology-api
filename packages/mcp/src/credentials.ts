import { exec } from 'node:child_process'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { homedir, hostname, userInfo } from 'node:os'
import { dirname, join } from 'node:path'

const CRED_PATH = join(homedir(), '.config', 'schoology-mcp', 'credentials.json')

export interface Credentials {
  username: string
  password: string
}

export interface FullCredentials extends Credentials {
  domain?: string
  sessionCachePath?: string
  sessionCacheKey?: string
}

function getKey(): Buffer {
  return scryptSync(
    `${hostname()}-${userInfo().username}`,
    'schoology-mcp-salt',
    32
  )
}

function encrypt(plaintext: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

function decrypt(data: string): string {
  const [ivHex, tagHex, encHex] = data.split(':')
  if (!ivHex || !tagHex || !encHex) throw new Error('malformed credential file')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivHex, 'hex')
  )
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

function loadStored(): Credentials | null {
  if (!existsSync(CRED_PATH)) return null
  try {
    return JSON.parse(decrypt(readFileSync(CRED_PATH, 'utf8')))
  } catch {
    return null
  }
}

function saveStored(creds: Credentials): void {
  mkdirSync(dirname(CRED_PATH), { recursive: true })
  writeFileSync(CRED_PATH, encrypt(JSON.stringify(creds)), { mode: 0o600 })
}

const ICON_CAP = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`
const ICON_USER = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
const ICON_KEY = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>`
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
const ICON_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

const FORM_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Schoology Sign-in</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #ffffff; padding: 2.5rem; border-radius: 16px; border: 1px solid #eaeaea; box-shadow: 0 10px 40px rgba(0,0,0,0.04); width: 100%; max-width: 400px; }
    .brand { display: flex; align-items: center; gap: 0.6rem; color: #111; margin-bottom: 1.25rem; }
    .brand-text { font-size: 1.3rem; font-weight: 600; letter-spacing: -0.01em; }
    h1 { margin: 0 0 0.35rem; font-size: 1.4rem; font-weight: 600; letter-spacing: -0.01em; }
    p.lead { margin: 0 0 1.75rem; color: #555; font-size: 0.93rem; line-height: 1.5; }
    label { display: block; font-size: 0.82rem; font-weight: 500; margin-bottom: 0.4rem; color: #333; }
    .field { position: relative; margin-bottom: 1rem; }
    .field svg { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }
    input { width: 100%; padding: 0.72rem 0.85rem 0.72rem 2.5rem; font-size: 0.98rem; border: 1px solid #e0e0e0; border-radius: 10px; background: #ffffff; color: #111; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
    input:focus { outline: none; border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
    button { width: 100%; padding: 0.8rem; background: #111; color: #ffffff; border: none; border-radius: 10px; font-size: 0.98rem; font-weight: 500; cursor: pointer; transition: background 0.15s; font-family: inherit; margin-top: 0.5rem; }
    button:hover { background: #000; }
    button:active { background: #222; }
    .hint { display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.78rem; color: #888; margin-top: 1.25rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">${ICON_CAP}<span class="brand-text">Schoology</span></div>
    <h1>Sign in to continue</h1>
    <p class="lead">Connect your Schoology account so Claude can access your grades, assignments, and messages.</p>
    <form method="post" action="/submit">
      <div class="field">
        ${ICON_USER}
        <input id="username" name="username" type="text" placeholder="Username or email" autocomplete="username" autofocus required />
      </div>
      <div class="field">
        ${ICON_KEY}
        <input id="password" name="password" type="text" placeholder="Password" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
      </div>
      <button type="submit">Sign in</button>
    </form>
    <div class="hint">${ICON_LOCK}<span>Encrypted and stored only on this machine</span></div>
  </div>
</body>
</html>`

const DONE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Connected</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #ffffff; padding: 3rem 2.5rem; border-radius: 16px; border: 1px solid #eaeaea; box-shadow: 0 10px 40px rgba(0,0,0,0.04); text-align: center; max-width: 400px; width: 100%; }
    .check { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #f3f3f3; border-radius: 50%; color: #111; margin-bottom: 1rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.35rem; font-weight: 600; letter-spacing: -0.01em; }
    p { margin: 0; color: #555; font-size: 0.93rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">${ICON_CHECK}</div>
    <h1>Connected</h1>
    <p>You can close this tab and return to Claude.</p>
  </div>
</body>
</html>`

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start ""'
        : 'xdg-open'
  exec(`${cmd} "${url}"`, () => {})
}

function promptViaBrowser(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method === 'GET' && (req.url === '/' || req.url === '/index')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(FORM_HTML)
        return
      }
      if (req.method === 'POST' && req.url === '/submit') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > 8192) req.destroy()
        })
        req.on('end', () => {
          const params = new URLSearchParams(body)
          const username = params.get('username') ?? ''
          const password = params.get('password') ?? ''
          if (!username || !password) {
            res.writeHead(400)
            res.end('Missing fields')
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(DONE_HTML)
          setTimeout(() => {
            server.close()
            resolve({ username, password })
          }, 300)
        })
        return
      }
      res.writeHead(404)
      res.end()
    })

    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('failed to bind credential server'))
        return
      }
      const url = `http://127.0.0.1:${addr.port}`
      console.error(`\n🎓 Schoology sign-in: ${url}\n`)
      openBrowser(url)
    })
  })
}

export async function loadCredentials(): Promise<FullCredentials> {
  const extra = {
    domain: process.env['SCHOOLOGY_DOMAIN'],
    sessionCachePath: process.env['SCHOOLOGY_SESSION_CACHE_PATH'],
    sessionCacheKey: process.env['SCHOOLOGY_SESSION_CACHE_KEY'],
  }

  const envUser = process.env['SCHOOLOGY_USERNAME']
  const envPass = process.env['SCHOOLOGY_PASSWORD']
  if (envUser && envPass) {
    return { username: envUser, password: envPass, ...extra }
  }

  const stored = loadStored()
  if (stored) return { ...stored, ...extra }

  const prompted = await promptViaBrowser()
  saveStored(prompted)
  return { ...prompted, ...extra }
}
