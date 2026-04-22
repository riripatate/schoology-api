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

const FORM_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Schoology Sign-in</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
    @media (prefers-color-scheme: dark) { body { background: #1c1c1e; } .card { background: #2c2c2e; color: #fff; } input { background: #1c1c1e; color: #fff; border-color: #3a3a3c; } p { color: #a1a1a6 !important; } }
    .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 380px; }
    h1 { margin: 0 0 0.25rem; font-size: 1.6rem; }
    p { margin: 0 0 1.75rem; color: #666; font-size: 0.92rem; }
    label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.45rem; }
    input { width: 100%; padding: 0.7rem 0.85rem; font-size: 1rem; border: 1px solid #d1d1d6; border-radius: 10px; margin-bottom: 1rem; transition: border-color 0.15s; }
    input:focus { outline: none; border-color: #0071e3; }
    button { width: 100%; padding: 0.8rem; background: #0071e3; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    button:hover { background: #0077ed; }
    button:active { background: #0062c4; }
    .hint { font-size: 0.8rem; color: #999; margin-top: 1rem; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎓 Schoology</h1>
    <p>Sign in so Claude can access your grades, assignments, and messages.</p>
    <form method="post" action="/submit">
      <label for="username">Username or email</label>
      <input id="username" name="username" type="text" autocomplete="username" autofocus required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">Sign in</button>
    </form>
    <div class="hint">Credentials are encrypted and stored only on this machine.</div>
  </div>
</body>
</html>`

const DONE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Connected</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f7; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    @media (prefers-color-scheme: dark) { body { background: #1c1c1e; } .card { background: #2c2c2e; color: #fff; } p { color: #a1a1a6 !important; } }
    .card { background: white; padding: 3rem 2.5rem; border-radius: 16px; text-align: center; max-width: 380px; }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { margin: 0; color: #666; }
  </style>
</head>
<body>
  <div class="card"><h1>✅ Connected</h1><p>You can close this tab and return to Claude.</p></div>
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
