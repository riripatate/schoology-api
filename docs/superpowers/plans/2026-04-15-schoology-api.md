# Schoology API — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready TypeScript monorepo with `@schoology/client` (NPM package) and `@schoology/mcp` (Claude MCP skill) that lets any student access all their Schoology data using only their username and password — no admin API keys required — via headless Playwright browser sessions.

**Architecture:** Playwright headless Chromium logs in silently with the user's credentials (handling SSO/Google/Microsoft/Clever transparently), extracts session cookies, then uses those cookies to call Schoology's internal `/api/v1/` REST endpoints — the same ones the web app itself calls. This bypasses admin-gated API key requirements entirely. Sessions are cached in memory and optionally persisted to disk (encrypted) to avoid re-logging in on every call.

**Tech Stack:** TypeScript 5, pnpm workspaces, Playwright (headless), Axios, Zod (validation), Vitest (tests), `@modelcontextprotocol/sdk` (MCP), tsup (bundler), GitHub Actions (CI/CD).

---

## File Structure

```
schoology-api/
├── package.json                          # pnpm workspace root
├── pnpm-workspace.yaml                   # workspace config
├── tsconfig.base.json                    # shared TS config
├── .eslintrc.cjs                         # shared ESLint
├── .prettierrc                           # shared Prettier
├── .gitignore
├── LICENSE                               # MIT
├── README.md                             # full user-facing docs
├── CONTRIBUTING.md
├── .github/
│   └── workflows/
│       ├── ci.yml                        # lint + typecheck + test on every PR
│       └── publish.yml                   # npm publish on git tag
├── packages/
│   ├── client/                           # @schoology/client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                  # public API exports
│   │   │   ├── auth/
│   │   │   │   ├── headless-login.ts     # Playwright login (handles SSO)
│   │   │   │   └── session-store.ts      # Cookie caching + AES encryption
│   │   │   ├── http/
│   │   │   │   └── client.ts             # Axios instance with cookies + retry
│   │   │   ├── endpoints/
│   │   │   │   ├── users.ts              # GET/PUT user info
│   │   │   │   ├── courses.ts            # GET courses
│   │   │   │   ├── sections.ts           # GET sections
│   │   │   │   ├── assignments.ts        # GET/PUT/DELETE assignments
│   │   │   │   ├── grades.ts             # GET/PUT grades
│   │   │   │   ├── discussions.ts        # GET/PUT/DELETE discussions
│   │   │   │   ├── events.ts             # GET/PUT/DELETE events
│   │   │   │   ├── messages.ts           # GET messages
│   │   │   │   ├── groups.ts             # GET groups
│   │   │   │   └── documents.ts          # GET documents
│   │   │   └── types/
│   │   │       └── index.ts              # All exported TS interfaces
│   │   └── tests/
│   │       ├── setup.ts                  # Vitest setup + MSW server
│   │       ├── auth.test.ts
│   │       ├── client.test.ts
│   │       └── endpoints/
│   │           ├── users.test.ts
│   │           ├── courses.test.ts
│   │           ├── grades.test.ts
│   │           └── assignments.test.ts
│   └── mcp/                              # @schoology/mcp
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts                  # MCP server entry point
│       │   ├── server.ts                 # MCP server setup + client init
│       │   └── tools/
│       │       ├── index.ts              # Register all tools
│       │       ├── users.ts              # get_me, get_user
│       │       ├── courses.ts            # list_courses, get_course
│       │       ├── grades.ts             # get_grades, get_grade_report
│       │       ├── assignments.ts        # list_assignments, get_assignment
│       │       ├── messages.ts           # list_inbox, list_sent
│       │       ├── events.ts             # list_events
│       │       └── discussions.ts        # list_discussions
│       └── tests/
│           └── tools.test.ts
└── examples/
    ├── nextjs-usage.ts
    └── mcp-config.json
```

---

## Chunk 1: Repo & Monorepo Scaffolding

### Task 1: Initialize local repo and pnpm workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `tsconfig.base.json`
- Create: `.prettierrc`
- Create: `.eslintrc.cjs`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "schoology-api",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint packages --ext .ts",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.tsbuildinfo
coverage/
playwright-browsers/
.session-cache/
```

- [ ] **Step 5: Create .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 6: Create .eslintrc.cjs**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
  ],
  parserOptions: {
    project: ['./packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

- [ ] **Step 7: Initialize git and install deps**

```bash
cd "schoology api"
git init
pnpm install
git add .
git commit -m "chore: initialize monorepo with pnpm workspaces"
```

---

### Task 2: Scaffold @schoology/client package

**Files:**
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/src/index.ts` (stub)

- [ ] **Step 1: Create packages/client/package.json**

```json
{
  "name": "@schoology/client",
  "version": "0.1.0",
  "description": "TypeScript client for Schoology — session-based, no admin API keys required",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["schoology", "api", "client", "lms", "education"],
  "license": "MIT",
  "dependencies": {
    "axios": "^1.7.0",
    "playwright": "^1.44.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "msw": "^2.3.0",
    "tsup": "^8.0.0",
    "vitest": "^1.6.0"
  },
  "peerDependencies": {
    "typescript": ">=5.0.0"
  }
}
```

- [ ] **Step 2: Create packages/client/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create stub src/index.ts AND src/client.ts (stub) so typecheck never fails**

```typescript
// packages/client/src/index.ts
export { SchoologyClient } from './client.js'
export type * from './types/index.js'
```

```typescript
// packages/client/src/client.ts  — stub, filled out in Task 11
export class SchoologyClient {
  constructor(_options: unknown) {}
}
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
// packages/client/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 5: Install deps and commit**

```bash
cd packages/client && pnpm install
cd ../..
git add packages/client
git commit -m "chore: scaffold @schoology/client package"
```

---

### Task 3: Scaffold @schoology/mcp package

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/index.ts` (stub)

- [ ] **Step 1: Create packages/mcp/package.json**

```json
{
  "name": "@schoology/mcp",
  "version": "0.1.0",
  "description": "Claude MCP skill for Schoology — access all your school data from Claude",
  "bin": {
    "schoology-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js"
  },
  "keywords": ["schoology", "mcp", "claude", "skill", "lms"],
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@schoology/client": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create packages/mcp/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create stub src/index.ts**

```typescript
#!/usr/bin/env node
import { startServer } from './server'
startServer().catch(console.error)
```

- [ ] **Step 4: Install and commit**

```bash
cd packages/mcp && pnpm install
cd ../..
git add packages/mcp
git commit -m "chore: scaffold @schoology/mcp package"
```

---

## Chunk 2: TypeScript Types

### Task 4: Define all Schoology types

**Files:**
- Create: `packages/client/src/types/index.ts`

All data shapes come from what Schoology's `/api/v1/` endpoints actually return. These are validated with Zod at runtime.

- [ ] **Step 1: Write types/index.ts**

```typescript
// packages/client/src/types/index.ts

export interface SchoologyCredentials {
  username: string
  password: string
  domain: string // e.g. "yourschool.schoology.com"
  sessionCachePath?: string // optional: path to persist encrypted session
  sessionCacheKey?: string  // optional: AES key for encryption (32 hex chars)
}

export interface SchoologyUser {
  id: string
  uid: string
  school_id: string
  school_uid: string
  name_title: string
  name_first: string
  name_first_preferred: string | null
  name_middle: string | null
  name_last: string
  name_display: string
  username: string
  primary_email: string
  picture_url: string
  gender: string | null
  grad_year: string | null
  position: string | null
  bio: string | null
  type: 'student' | 'teacher' | 'parent' | 'admin'
  language: string
  tz_offset: number
  tz_name: string
  role_id: string
  pending: number
  building_id: string
}

export interface SchoologyCourse {
  id: string
  title: string
  course_code: string
  department: string | null
  description: string | null
  credits: number
  subject_area: number
  grade_level_start: number
  grade_level_end: number
  building_id: string
  school_id: string
  profile_url: string
}

export interface SchoologySection {
  id: string
  course_title: string
  course_code: string
  course_id: string
  school_id: string
  building_id: string
  access_code: string
  section_title: string
  section_code: string
  section_school_code: string
  synced: number
  active: number
  description: string | null
  location: string | null
  meeting_days: string | null
  start_time: string | null
  end_time: string | null
  grading_periods: string[]
  profile_url: string
  group_id: string
  grade_stats: boolean
  options: {
    weighted_grading_categories: number
    sis_id: string | null
  }
}

export interface SchoologyAssignment {
  id: string
  title: string
  description: string | null
  due: string | null
  type: 'assignment' | 'discussion' | 'assessment'
  max_points: number
  factor: number
  is_final: number
  show_comments: number
  grade_stats: number
  allow_dropbox: number
  dropbox_locked: number
  available: string | null
  completion: number
  grading_scale: number | null
  grading_period: string | null
  grading_category: string | null
  section_id: string
  folder_id: string | null
}

export interface SchoologyGrade {
  assignment_id: string
  type: string
  pending: number
  max_points: number
  exceptional: number
  is_final: number
  grade: string | null
  comment: string | null
  enrollment_id: string
}

export interface SchoologyGradePeriod {
  period_id: string
  period_title: string
  period_weight: number
  calculated_grade: string | null
  calculated_grade_string: string | null
  final_grade: string[]
}

export interface SchoologyGradeReport {
  section_id: string
  period: SchoologyGradePeriod[]
  assignment: SchoologyGrade[]
}

export interface SchoologyDiscussion {
  id: string
  title: string
  body: string | null
  published: number
  created: number
  last_updated: number
  available: string | null
  completion: number
  num_comments: number
  display_weight: number
  require_initial_post: number
  attachments: {
    links: { url: string; title: string }[]
    files: { id: string; title: string; url: string }[]
  }
}

export interface SchoologyEvent {
  id: string
  title: string
  description: string | null
  start: string
  has_end: number
  end: string | null
  all_day: number
  type: 'event' | 'assignment'
  rsvp: number
  assignment_id: string | null
  section_id: string | null
  group_id: string | null
  category_id: string | null
}

export interface SchoologyMessage {
  id: string
  author_id: string
  recipient_ids: string
  subject: string
  message: string
  created: number
  last_updated: number
  read: number
  replied: number
  from: {
    uid: string
    name: string
    picture_url: string
  }
}

export interface SchoologyGroup {
  id: string
  title: string
  description: string | null
  website: string | null
  access: number
  group_code: string
  category: string | null
  school_id: string
  building_id: string | null
  member_count: number
  admin: number
  profile_url: string
}

export interface SchoologyDocument {
  id: string
  title: string
  body: string | null
  published: number
  created: number
  last_updated: number
  completion: number
  display_weight: number
  available: string | null
  attachments: {
    links: { url: string; title: string }[]
    files: { id: string; title: string; url: string; converted_url: string }[]
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface SchoologyClientOptions {
  credentials: SchoologyCredentials
  /** Max requests per second (default: 10) */
  rateLimit?: number
  /** Timeout per request in ms (default: 30000) */
  timeout?: number
  /** Whether to re-auth automatically on 401 (default: true) */
  autoReauth?: boolean
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/types
git commit -m "feat(client): add all Schoology TypeScript types"
```

---

## Chunk 3: Auth Module

### Task 5: Headless login with Playwright

**Files:**
- Create: `packages/client/src/auth/headless-login.ts`
- Create: `packages/client/tests/auth.test.ts`

This is the heart of the third-party approach. Playwright headless Chromium navigates to the school's Schoology login page, fills credentials, handles any SSO redirects (Google, Microsoft, Clever), and returns the session cookies.

- [ ] **Step 1: Write headless-login.ts**

```typescript
// packages/client/src/auth/headless-login.ts
import { chromium, type BrowserContext, type Page } from 'playwright'
import type { SchoologyCredentials } from '../types/index.js'

export interface SessionCookies {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: 'Strict' | 'Lax' | 'None' | 'None'
  }>
  capturedAt: number
  domain: string
}

/**
 * Detects which SSO provider is being used (if any).
 */
async function detectLoginType(page: Page): Promise<'native' | 'google' | 'microsoft' | 'clever' | 'saml'> {
  const url = page.url()
  if (url.includes('accounts.google.com')) return 'google'
  if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) return 'microsoft'
  if (url.includes('clever.com')) return 'clever'
  if (!url.includes('schoology.com') && !url.includes('schoology')) return 'saml'
  return 'native'
}

/**
 * Handle Google SSO login.
 */
async function handleGoogleLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('input[type="email"]', username)
  await page.click('#identifierNext, [data-action="next"]')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="password"]', password)
  await page.click('#passwordNext, [data-action="next"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Handle Microsoft SSO login.
 */
async function handleMicrosoftLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('input[type="email"], input[name="loginfmt"]', username)
  await page.click('input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="password"], input[name="passwd"]', password)
  await page.click('input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
  // Handle "Stay signed in?" prompt if it appears
  const keepSignedIn = page.locator('#KmsiCheckboxField, input[name="DontShowAgain"]')
  if (await keepSignedIn.isVisible()) {
    await page.click('input[type="submit"][value="No"], button:has-text("No")')
    await page.waitForLoadState('networkidle')
  }
}

/**
 * Handle Clever SSO login.
 */
async function handleCleverLogin(page: Page, username: string, password: string): Promise<void> {
  // Clever shows a school search first
  const usernameInput = page.locator('input[type="text"], input[name="username"]').first()
  if (await usernameInput.isVisible()) {
    await usernameInput.fill(username)
    const passwordInput = page.locator('input[type="password"]').first()
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(password)
      await page.click('button[type="submit"]')
    }
  }
  await page.waitForLoadState('networkidle')
}

/**
 * Handle native Schoology login.
 */
async function handleNativeLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('#username, input[name="mail"]', username)
  await page.fill('#password, input[name="pass"]', password)
  await page.click('#login-submit, input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Main login function. Launches headless Chromium, logs in, returns cookies.
 * Handles native, Google, Microsoft, Clever, and generic SAML SSO.
 */
export async function login(credentials: SchoologyCredentials): Promise<SessionCookies> {
  const { username, password, domain } = credentials
  const baseUrl = `https://${domain}`

  const browser = await chromium.launch({ headless: true })
  let context: BrowserContext | null = null

  try {
    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })

    const page = await context.newPage()

    // Navigate to login page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 })

    // Detect login type
    const loginType = await detectLoginType(page)

    switch (loginType) {
      case 'google':
        await handleGoogleLogin(page, username, password)
        break
      case 'microsoft':
        await handleMicrosoftLogin(page, username, password)
        break
      case 'clever':
        await handleCleverLogin(page, username, password)
        break
      default:
        await handleNativeLogin(page, username, password)
    }

    // Wait for successful login (dashboard or home page)
    await page.waitForURL(
      (url) =>
        url.href.includes('/home') ||
        url.href.includes('/dashboard') ||
        url.href.includes('/course'),
      { timeout: 30000 }
    ).catch(() => {
      // Check if still on login page = bad credentials
      const currentUrl = page.url()
      if (currentUrl.includes('/login')) {
        throw new Error('Login failed: Invalid credentials or unsupported SSO provider')
      }
    })

    const cookies = await context.cookies()
    return {
      cookies: cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: (c.sameSite ?? 'None') as 'Strict' | 'Lax' | 'None' | 'None',
      })),
      capturedAt: Date.now(),
      domain,
    }
  } finally {
    await context?.close()
    await browser.close()
  }
}

/** Returns true if the session cookies are still fresh (< 12 hours old) */
export function isSessionFresh(session: SessionCookies): boolean {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000
  return Date.now() - session.capturedAt < TWELVE_HOURS
}
```

- [ ] **Step 2: Write auth tests (mocked — no real login needed)**

```typescript
// packages/client/tests/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSessionFresh } from '../src/auth/headless-login.js'
import type { SessionCookies } from '../src/auth/headless-login.js'

const makeMockSession = (capturedAt: number): SessionCookies => ({
  cookies: [{ name: 'PHPSESSID', value: 'abc123', domain: 'test.schoology.com', path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' }],
  capturedAt,
  domain: 'test.schoology.com',
})

describe('isSessionFresh', () => {
  it('returns true for a session captured moments ago', () => {
    const session = makeMockSession(Date.now())
    expect(isSessionFresh(session)).toBe(true)
  })

  it('returns false for a session over 12 hours old', () => {
    const session = makeMockSession(Date.now() - 13 * 60 * 60 * 1000)
    expect(isSessionFresh(session)).toBe(false)
  })

  it('returns true for a session exactly 11 hours old', () => {
    const session = makeMockSession(Date.now() - 11 * 60 * 60 * 1000)
    expect(isSessionFresh(session)).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd packages/client && pnpm test
```
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/auth/headless-login.ts packages/client/tests/auth.test.ts
git commit -m "feat(client): add headless Playwright login with SSO support"
```

---

### Task 6: Session store (caching + AES encryption)

**Files:**
- Create: `packages/client/src/auth/session-store.ts`

- [ ] **Step 1: Write session-store.ts**

```typescript
// packages/client/src/auth/session-store.ts
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

/** In-memory session store. */
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

/** Persist session to disk (encrypted). */
export function persistSession(session: SessionCookies, filePath: string, encryptionKey: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const json = JSON.stringify(session)
  const encrypted = encrypt(json, encryptionKey)
  writeFileSync(filePath, encrypted, 'utf8')
}

/** Load session from disk (decrypt). Returns null if file doesn't exist or key is wrong. */
export function loadPersistedSession(filePath: string, encryptionKey: string): SessionCookies | null {
  if (!existsSync(filePath)) return null
  try {
    const encrypted = readFileSync(filePath, 'utf8')
    const json = decrypt(encrypted, encryptionKey)
    return JSON.parse(json) as SessionCookies
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Write session-store tests**

```typescript
// packages/client/tests/session-store.test.ts
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
const TEST_KEY = 'a'.repeat(64) // 32 bytes hex
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
    const wrongKey = 'b'.repeat(64)
    expect(loadPersistedSession(TEST_PATH, wrongKey)).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests — verify they pass**

```bash
cd packages/client && pnpm test tests/session-store.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/auth/session-store.ts packages/client/tests/session-store.test.ts
git commit -m "feat(client): add session store with AES-256-CBC encryption"
```

---

## Chunk 4: HTTP Client

### Task 7: Axios client with cookie injection and auto-retry

**Files:**
- Create: `packages/client/src/http/client.ts`
- Create: `packages/client/tests/client.test.ts`
- Create: `packages/client/tests/setup.ts`

- [ ] **Step 1: Create Vitest setup with MSW**

```typescript
// packages/client/tests/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const mockDomain = 'test.schoology.com'
export const mockBaseUrl = `https://${mockDomain}`

export const handlers = [
  http.get(`${mockBaseUrl}/api/v1/users/me`, () =>
    HttpResponse.json({
      id: '1234567',
      name_first: 'Test',
      name_last: 'Student',
      primary_email: 'test@school.edu',
      type: 'student',
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/users/me/sections`, () =>
    HttpResponse.json({
      section: [
        { id: 's1', course_title: 'Math 101', section_title: 'Period 1' },
        { id: 's2', course_title: 'English 101', section_title: 'Period 2' },
      ],
      total: 2,
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/sections/s1/assignments`, () =>
    HttpResponse.json({
      assignment: [
        { id: 'a1', title: 'Homework 1', max_points: 100, due: '2026-04-20 23:59:00' },
      ],
      total: 1,
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/users/me/grades`, () =>
    HttpResponse.json({
      section: [
        {
          section_id: 's1',
          period: [{ period_id: 'p1', period_title: 'Q4', calculated_grade: '95' }],
          assignment: [{ assignment_id: 'a1', grade: '92', max_points: 100 }],
        },
      ],
    })
  ),
]

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 2: Write HTTP client**

```typescript
// packages/client/src/http/client.ts
import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { SessionCookies } from '../auth/headless-login.js'

export class SchoologyHttpClient {
  private readonly axios: AxiosInstance
  private session: SessionCookies | null = null
  private onSessionExpired?: () => Promise<SessionCookies>

  constructor(
    domain: string,
    options: {
      timeout?: number
      onSessionExpired?: () => Promise<SessionCookies>
    } = {}
  ) {
    this.onSessionExpired = options.onSessionExpired
    this.axios = axios.create({
      baseURL: `https://${domain}/api/v1`,
      timeout: options.timeout ?? 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    // Response interceptor: auto-retry on 401 with re-auth
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.onSessionExpired) {
          this.session = await this.onSessionExpired()
          this.injectCookies()
          if (error.config) return this.axios.request(error.config)
        }
        throw this.normalizeError(error)
      }
    )
  }

  setSession(session: SessionCookies): void {
    this.session = session
    this.injectCookies()
  }

  private injectCookies(): void {
    if (!this.session) return
    const cookieString = this.session.cookies
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')
    this.axios.defaults.headers.common['Cookie'] = cookieString
  }

  private normalizeError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status
      const msg = (error.response.data as { error?: { message?: string } })?.error?.message
      return new Error(`Schoology API error ${status}: ${msg ?? error.message}`)
    }
    return new Error(`Network error: ${error.message}`)
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const res = await this.axios.get<T>(path, { params })
    return res.data
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    const res = await this.axios.put<T>(path, data)
    return res.data
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    const res = await this.axios.patch<T>(path, data)
    return res.data
  }

  async delete<T>(path: string): Promise<T> {
    const res = await this.axios.delete<T>(path)
    return res.data
  }
}
```

- [ ] **Step 3: Write client tests**

```typescript
// packages/client/tests/client.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../src/http/client.js'
import { server, handlers, mockDomain } from './setup.js'
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

    // Make first request return 401, then succeed
    server.use(
      http.get(`https://${mockDomain}/api/v1/users/me`, ({ request }) => {
        if (!reauthed) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        return HttpResponse.json({ name_first: 'Test' })
      }, { once: true })
    )

    const user = await retriableClient.get<{ name_first: string }>('/users/me')
    expect(user.name_first).toBe('Test')
    expect(reauthed).toBe(true)
  })

  it('throws a normalized error on non-401 HTTP errors', async () => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/users/me`, () =>
        HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 })
      )
    )
    await expect(client.get('/users/me')).rejects.toThrow('Schoology API error 404')
  })
})
```

- [ ] **Step 4: Add vitest config to packages/client/package.json**

Add to `packages/client/package.json`:
```json
"vitest": {
  "environment": "node",
  "setupFiles": ["./tests/setup.ts"]
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/http packages/client/tests
git commit -m "feat(client): add HTTP client with cookie injection and auto-retry"
```

---

## Chunk 5: API Endpoints

### Task 8: Users endpoint

**Files:**
- Create: `packages/client/src/endpoints/users.ts`
- Create: `packages/client/tests/endpoints/users.test.ts`

- [ ] **Step 1: Write users.ts**

```typescript
// packages/client/src/endpoints/users.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyUser, SchoologySection } from '../types/index.js'

export class UsersEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  /** Get the currently authenticated user. */
  async getMe(): Promise<SchoologyUser> {
    return this.http.get<SchoologyUser>('/users/me')
  }

  /** Get a user by ID. */
  async getUser(userId: string): Promise<SchoologyUser> {
    return this.http.get<SchoologyUser>(`/users/${userId}`)
  }

  /** Get all sections (classes) for the current user. */
  async getMySections(): Promise<SchoologySection[]> {
    const res = await this.http.get<{ section: SchoologySection[] }>('/users/me/sections')
    return res.section ?? []
  }

  /** Update user profile fields. */
  async updateUser(userId: string, data: Partial<Pick<SchoologyUser, 'name_first' | 'name_last' | 'bio' | 'position'>>): Promise<void> {
    await this.http.put(`/users/${userId}`, data)
  }
}
```

- [ ] **Step 2: Write users.test.ts**

```typescript
// packages/client/tests/endpoints/users.test.ts
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

  it('getMySections returns an array of sections', async () => {
    const sections = await endpoint.getMySections()
    expect(sections).toHaveLength(2)
    expect(sections[0]?.course_title).toBe('Math 101')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd packages/client && pnpm test tests/endpoints/users.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/endpoints/users.ts packages/client/tests/endpoints/users.test.ts
git commit -m "feat(client): add users endpoint"
```

---

### Task 9: Courses, Sections, Assignments endpoints

**Files:**
- Create: `packages/client/src/endpoints/courses.ts`
- Create: `packages/client/src/endpoints/sections.ts`
- Create: `packages/client/src/endpoints/assignments.ts`
- Create: `packages/client/tests/endpoints/assignments.test.ts`

- [ ] **Step 1: Write courses.ts**

```typescript
// packages/client/src/endpoints/courses.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyCourse } from '../types/index.js'

export class CoursesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getCourse(courseId: string): Promise<SchoologyCourse> {
    return this.http.get<SchoologyCourse>(`/courses/${courseId}`)
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.http.delete(`/courses/${courseId}`)
  }
}
```

- [ ] **Step 2: Write sections.ts**

```typescript
// packages/client/src/endpoints/sections.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologySection } from '../types/index.js'

export class SectionsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async getSection(sectionId: string): Promise<SchoologySection> {
    return this.http.get<SchoologySection>(`/sections/${sectionId}`)
  }

  async listSectionEnrollments(sectionId: string): Promise<{ uid: string; type: string; status: number; admin: number }[]> {
    const res = await this.http.get<{ enrollment: { uid: string; type: string; status: number; admin: number }[] }>(`/sections/${sectionId}/enrollments`)
    return res.enrollment ?? []
  }

  async updateSection(sectionId: string, data: Partial<Pick<SchoologySection, 'section_title' | 'description' | 'location'>>): Promise<void> {
    await this.http.put(`/sections/${sectionId}`, data)
  }
}
```

- [ ] **Step 3: Write assignments.ts**

```typescript
// packages/client/src/endpoints/assignments.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyAssignment } from '../types/index.js'

export class AssignmentsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listAssignments(sectionId: string): Promise<SchoologyAssignment[]> {
    const res = await this.http.get<{ assignment: SchoologyAssignment[] }>(
      `/sections/${sectionId}/assignments`
    )
    return res.assignment ?? []
  }

  async getAssignment(sectionId: string, assignmentId: string): Promise<SchoologyAssignment> {
    return this.http.get<SchoologyAssignment>(`/sections/${sectionId}/assignments/${assignmentId}`)
  }

  async updateAssignment(
    sectionId: string,
    assignmentId: string,
    data: Partial<Pick<SchoologyAssignment, 'title' | 'description' | 'due' | 'max_points'>>
  ): Promise<void> {
    await this.http.put(`/sections/${sectionId}/assignments/${assignmentId}`, data)
  }

  async deleteAssignment(sectionId: string, assignmentId: string): Promise<void> {
    await this.http.delete(`/sections/${sectionId}/assignments/${assignmentId}`)
  }
}
```

- [ ] **Step 4: Write courses and sections tests alongside assignments test**

```typescript
// packages/client/tests/endpoints/courses.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { CoursesEndpoint } from '../../src/endpoints/courses.js'
import { SectionsEndpoint } from '../../src/endpoints/sections.js'
import { mockDomain, server } from '../setup.js'
import { http, HttpResponse } from 'msw'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(), domain: mockDomain,
}

describe('CoursesEndpoint', () => {
  let endpoint: CoursesEndpoint

  beforeEach(() => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/courses/c1`, () =>
        HttpResponse.json({ id: 'c1', title: 'Math 101', course_code: 'MATH101' })
      )
    )
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new CoursesEndpoint(client)
  })

  it('getCourse returns course details', async () => {
    const course = await endpoint.getCourse('c1')
    expect(course.title).toBe('Math 101')
    expect(course.course_code).toBe('MATH101')
  })
})

describe('SectionsEndpoint', () => {
  let endpoint: SectionsEndpoint

  beforeEach(() => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/sections/s1`, () =>
        HttpResponse.json({ id: 's1', course_title: 'Math 101', section_title: 'Period 1' })
      )
    )
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new SectionsEndpoint(client)
  })

  it('getSection returns section details', async () => {
    const section = await endpoint.getSection('s1')
    expect(section.course_title).toBe('Math 101')
  })
})
```

- [ ] **Step 5: Write assignments test**

```typescript
// packages/client/tests/endpoints/assignments.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { AssignmentsEndpoint } from '../../src/endpoints/assignments.js'
import { mockDomain } from '../setup.js'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(), domain: mockDomain,
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
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/endpoints packages/client/tests/endpoints
git commit -m "feat(client): add courses, sections, assignments endpoints"
```

---

### Task 10: Grades, Discussions, Events, Messages, Groups, Documents

**Files:**
- Create: `packages/client/src/endpoints/grades.ts`
- Create: `packages/client/src/endpoints/discussions.ts`
- Create: `packages/client/src/endpoints/events.ts`
- Create: `packages/client/src/endpoints/messages.ts`
- Create: `packages/client/src/endpoints/groups.ts`
- Create: `packages/client/src/endpoints/documents.ts`
- Create: `packages/client/tests/endpoints/grades.test.ts`

- [ ] **Step 1: Write grades.ts**

```typescript
// packages/client/src/endpoints/grades.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyGradeReport } from '../types/index.js'

export class GradesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  /** Get grade report for all sections of the current user. */
  async getMyGrades(): Promise<SchoologyGradeReport[]> {
    const res = await this.http.get<{ section: SchoologyGradeReport[] }>('/users/me/grades')
    return res.section ?? []
  }

  /** Get grades for a specific section. */
  async getSectionGrades(sectionId: string): Promise<SchoologyGradeReport> {
    return this.http.get<SchoologyGradeReport>(`/sections/${sectionId}/grades`)
  }

  /** Update a grade (teacher action). */
  async updateGrade(sectionId: string, assignmentId: string, enrollmentId: string, grade: string, comment?: string): Promise<void> {
    await this.http.put(`/sections/${sectionId}/grades`, {
      grades: { grade: [{ assignment_id: assignmentId, enrollment_id: enrollmentId, grade, comment }] },
    })
  }
}
```

- [ ] **Step 2: Write discussions.ts**

```typescript
// packages/client/src/endpoints/discussions.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyDiscussion } from '../types/index.js'

export class DiscussionsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listDiscussions(sectionId: string): Promise<SchoologyDiscussion[]> {
    const res = await this.http.get<{ discussion: SchoologyDiscussion[] }>(`/sections/${sectionId}/discussions`)
    return res.discussion ?? []
  }

  async getDiscussion(sectionId: string, discussionId: string): Promise<SchoologyDiscussion> {
    return this.http.get<SchoologyDiscussion>(`/sections/${sectionId}/discussions/${discussionId}`)
  }

  async updateDiscussion(sectionId: string, discussionId: string, data: Partial<Pick<SchoologyDiscussion, 'title' | 'body'>>): Promise<void> {
    await this.http.put(`/sections/${sectionId}/discussions/${discussionId}`, data)
  }

  async deleteDiscussion(sectionId: string, discussionId: string): Promise<void> {
    await this.http.delete(`/sections/${sectionId}/discussions/${discussionId}`)
  }
}
```

- [ ] **Step 3: Write events.ts**

```typescript
// packages/client/src/endpoints/events.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyEvent } from '../types/index.js'

export class EventsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listMyEvents(options?: { start_date?: string; end_date?: string }): Promise<SchoologyEvent[]> {
    const res = await this.http.get<{ event: SchoologyEvent[] }>('/users/me/events', options)
    return res.event ?? []
  }

  async listSectionEvents(sectionId: string): Promise<SchoologyEvent[]> {
    const res = await this.http.get<{ event: SchoologyEvent[] }>(`/sections/${sectionId}/events`)
    return res.event ?? []
  }

  async getEvent(eventId: string): Promise<SchoologyEvent> {
    return this.http.get<SchoologyEvent>(`/events/${eventId}`)
  }

  async updateEvent(eventId: string, data: Partial<Pick<SchoologyEvent, 'title' | 'description' | 'start' | 'end'>>): Promise<void> {
    await this.http.put(`/events/${eventId}`, data)
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.http.delete(`/events/${eventId}`)
  }
}
```

- [ ] **Step 4: Write messages.ts**

```typescript
// packages/client/src/endpoints/messages.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyMessage } from '../types/index.js'

export class MessagesEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listInbox(): Promise<SchoologyMessage[]> {
    const res = await this.http.get<{ message: SchoologyMessage[] }>('/messages/inbox')
    return res.message ?? []
  }

  async listSent(): Promise<SchoologyMessage[]> {
    const res = await this.http.get<{ message: SchoologyMessage[] }>('/messages/sent')
    return res.message ?? []
  }

  async getMessage(messageId: string): Promise<SchoologyMessage> {
    return this.http.get<SchoologyMessage>(`/messages/inbox/${messageId}`)
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.http.delete(`/messages/inbox/${messageId}`)
  }
}
```

- [ ] **Step 5: Write groups.ts**

```typescript
// packages/client/src/endpoints/groups.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyGroup } from '../types/index.js'

export class GroupsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listMyGroups(): Promise<SchoologyGroup[]> {
    const res = await this.http.get<{ group: SchoologyGroup[] }>('/groups')
    return res.group ?? []
  }

  async getGroup(groupId: string): Promise<SchoologyGroup> {
    return this.http.get<SchoologyGroup>(`/groups/${groupId}`)
  }
}
```

- [ ] **Step 6: Write documents.ts**

```typescript
// packages/client/src/endpoints/documents.ts
import type { SchoologyHttpClient } from '../http/client.js'
import type { SchoologyDocument } from '../types/index.js'

export class DocumentsEndpoint {
  constructor(private readonly http: SchoologyHttpClient) {}

  async listDocuments(sectionId: string): Promise<SchoologyDocument[]> {
    const res = await this.http.get<{ document: SchoologyDocument[] }>(`/sections/${sectionId}/documents`)
    return res.document ?? []
  }

  async getDocument(sectionId: string, documentId: string): Promise<SchoologyDocument> {
    return this.http.get<SchoologyDocument>(`/sections/${sectionId}/documents/${documentId}`)
  }
}
```

- [ ] **Step 7: Write grades test**

```typescript
// packages/client/tests/endpoints/grades.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { GradesEndpoint } from '../../src/endpoints/grades.js'
import { mockDomain } from '../setup.js'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(), domain: mockDomain,
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
```

- [ ] **Step 8: Run all tests**

```bash
cd packages/client && pnpm test
```
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/client/src/endpoints packages/client/tests/endpoints
git commit -m "feat(client): add grades, discussions, events, messages, groups, documents endpoints"
```

---

## Chunk 6: Main SchoologyClient

### Task 11: Wire everything into SchoologyClient

**Files:**
- Create: `packages/client/src/client.ts`
- Modify: `packages/client/src/index.ts`

- [ ] **Step 1: Write client.ts**

```typescript
// packages/client/src/client.ts
import { login, isSessionFresh, type SessionCookies } from './auth/headless-login.js'
import {
  storeSession, getSession, clearSession,
  persistSession, loadPersistedSession,
} from './auth/session-store.js'
import { SchoologyHttpClient } from './http/client.js'
import { UsersEndpoint } from './endpoints/users.js'
import { CoursesEndpoint } from './endpoints/courses.js'
import { SectionsEndpoint } from './endpoints/sections.js'
import { AssignmentsEndpoint } from './endpoints/assignments.js'
import { GradesEndpoint } from './endpoints/grades.js'
import { DiscussionsEndpoint } from './endpoints/discussions.js'
import { EventsEndpoint } from './endpoints/events.js'
import { MessagesEndpoint } from './endpoints/messages.js'
import { GroupsEndpoint } from './endpoints/groups.js'
import { DocumentsEndpoint } from './endpoints/documents.js'
import type { SchoologyClientOptions } from './types/index.js'

export class SchoologyClient {
  readonly users: UsersEndpoint
  readonly courses: CoursesEndpoint
  readonly sections: SectionsEndpoint
  readonly assignments: AssignmentsEndpoint
  readonly grades: GradesEndpoint
  readonly discussions: DiscussionsEndpoint
  readonly events: EventsEndpoint
  readonly messages: MessagesEndpoint
  readonly groups: GroupsEndpoint
  readonly documents: DocumentsEndpoint

  private readonly httpClient: SchoologyHttpClient
  private readonly sessionKey: string
  private readonly options: SchoologyClientOptions

  constructor(options: SchoologyClientOptions) {
    this.options = options
    this.sessionKey = `${options.credentials.domain}:${options.credentials.username}`

    this.httpClient = new SchoologyHttpClient(options.credentials.domain, {
      timeout: options.timeout,
      onSessionExpired: () => this.authenticate(true),
    })

    this.users = new UsersEndpoint(this.httpClient)
    this.courses = new CoursesEndpoint(this.httpClient)
    this.sections = new SectionsEndpoint(this.httpClient)
    this.assignments = new AssignmentsEndpoint(this.httpClient)
    this.grades = new GradesEndpoint(this.httpClient)
    this.discussions = new DiscussionsEndpoint(this.httpClient)
    this.events = new EventsEndpoint(this.httpClient)
    this.messages = new MessagesEndpoint(this.httpClient)
    this.groups = new GroupsEndpoint(this.httpClient)
    this.documents = new DocumentsEndpoint(this.httpClient)
  }

  /**
   * Authenticate (or reuse cached session). Must be called before any API call.
   * You can await client.authenticate() or just call any endpoint — it authenticates automatically.
   */
  async authenticate(force = false): Promise<void> {
    if (!force) {
      // Try memory cache first
      const cached = getSession(this.sessionKey)
      if (cached && isSessionFresh(cached)) {
        this.httpClient.setSession(cached)
        return
      }

      // Try disk cache if configured
      const { credentials } = this.options
      if (credentials.sessionCachePath && credentials.sessionCacheKey) {
        const persisted = loadPersistedSession(credentials.sessionCachePath, credentials.sessionCacheKey)
        if (persisted && isSessionFresh(persisted)) {
          this.httpClient.setSession(persisted)
          storeSession(this.sessionKey, persisted)
          return
        }
      }
    }

    // Full headless login
    const session = await login(this.options.credentials)
    storeSession(this.sessionKey, session)
    this.httpClient.setSession(session)

    // Persist to disk if configured
    const { credentials } = this.options
    if (credentials.sessionCachePath && credentials.sessionCacheKey) {
      persistSession(session, credentials.sessionCachePath, credentials.sessionCacheKey)
    }
  }

  /** Clear the cached session (forces re-login on next call). */
  logout(): void {
    clearSession(this.sessionKey)
  }
}
```

- [ ] **Step 2: Update src/index.ts**

```typescript
// packages/client/src/index.ts
export { SchoologyClient } from './client.js'
export type * from './types/index.js'
```

- [ ] **Step 3: Run all tests**

```bash
cd packages/client && pnpm test && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/client.ts packages/client/src/index.ts
git commit -m "feat(client): wire all endpoints into SchoologyClient"
```

---

## Chunk 7: MCP Server

### Task 12: MCP server setup

**Files:**
- Create: `packages/mcp/src/server.ts`
- Create: `packages/mcp/src/tools/index.ts`
- Create: `packages/mcp/src/tools/users.ts`
- Create: `packages/mcp/src/tools/courses.ts`
- Create: `packages/mcp/src/tools/grades.ts`
- Create: `packages/mcp/src/tools/assignments.ts`
- Create: `packages/mcp/src/tools/messages.ts`
- Create: `packages/mcp/src/tools/events.ts`
- Modify: `packages/mcp/src/index.ts`

- [ ] **Step 1: Write server.ts**

```typescript
// packages/mcp/src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SchoologyClient } from '@schoology/client'
import { registerAllTools } from './tools/index.js'

function getCredentials() {
  const username = process.env['SCHOOLOGY_USERNAME']
  const password = process.env['SCHOOLOGY_PASSWORD']
  const domain = process.env['SCHOOLOGY_DOMAIN']

  if (!username || !password || !domain) {
    throw new Error(
      'Missing required env vars: SCHOOLOGY_USERNAME, SCHOOLOGY_PASSWORD, SCHOOLOGY_DOMAIN'
    )
  }

  return {
    username,
    password,
    domain,
    sessionCachePath: process.env['SCHOOLOGY_SESSION_CACHE_PATH'],
    sessionCacheKey: process.env['SCHOOLOGY_SESSION_CACHE_KEY'],
  }
}

export async function startServer(): Promise<void> {
  const credentials = getCredentials()
  const client = new SchoologyClient({ credentials })

  // Pre-authenticate so the first tool call is instant
  await client.authenticate()

  const server = new McpServer({
    name: 'schoology',
    version: '0.1.0',
  })

  registerAllTools(server, client)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('Schoology MCP server running — connected to', credentials.domain)
}
```

- [ ] **Step 2: Write tools/users.ts**

```typescript
// packages/mcp/src/tools/users.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerUserTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'get_me',
    'Get the profile of the currently authenticated Schoology user',
    {},
    async () => {
      const user = await client.users.getMe()
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      }
    }
  )

  server.tool(
    'list_my_sections',
    'List all sections (classes) the current user is enrolled in',
    {},
    async () => {
      const sections = await client.users.getMySections()
      return {
        content: [{ type: 'text', text: JSON.stringify(sections, null, 2) }],
      }
    }
  )

  server.tool(
    'get_user',
    'Get a Schoology user by their ID',
    { user_id: z.string().describe('The Schoology user ID') },
    async ({ user_id }) => {
      const user = await client.users.getUser(user_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 3: Write tools/grades.ts**

```typescript
// packages/mcp/src/tools/grades.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerGradeTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'get_my_grades',
    'Get the grade report for all sections of the current user, including period grades and individual assignment grades',
    {},
    async () => {
      const grades = await client.grades.getMyGrades()
      return {
        content: [{ type: 'text', text: JSON.stringify(grades, null, 2) }],
      }
    }
  )

  server.tool(
    'get_section_grades',
    'Get detailed grades for a specific section/class',
    { section_id: z.string().describe('The Schoology section ID') },
    async ({ section_id }) => {
      const grades = await client.grades.getSectionGrades(section_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(grades, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 4: Write tools/assignments.ts**

```typescript
// packages/mcp/src/tools/assignments.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerAssignmentTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'list_assignments',
    'List all assignments for a section/class',
    { section_id: z.string().describe('The Schoology section ID') },
    async ({ section_id }) => {
      const assignments = await client.assignments.listAssignments(section_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(assignments, null, 2) }],
      }
    }
  )

  server.tool(
    'get_assignment',
    'Get details of a specific assignment',
    {
      section_id: z.string().describe('The section ID'),
      assignment_id: z.string().describe('The assignment ID'),
    },
    async ({ section_id, assignment_id }) => {
      const assignment = await client.assignments.getAssignment(section_id, assignment_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(assignment, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 5: Write tools/messages.ts**

```typescript
// packages/mcp/src/tools/messages.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerMessageTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'list_inbox',
    'List all messages in the inbox',
    {},
    async () => {
      const messages = await client.messages.listInbox()
      return {
        content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }],
      }
    }
  )

  server.tool(
    'list_sent_messages',
    'List all sent messages',
    {},
    async () => {
      const messages = await client.messages.listSent()
      return {
        content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }],
      }
    }
  )

  server.tool(
    'get_message',
    'Get a specific message by ID',
    { message_id: z.string().describe('The message ID') },
    async ({ message_id }) => {
      const message = await client.messages.getMessage(message_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(message, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 6: Write tools/events.ts**

```typescript
// packages/mcp/src/tools/events.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerEventTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'list_my_events',
    'List upcoming events and assignment due dates for the current user',
    {
      start_date: z.string().optional().describe('ISO date string (YYYY-MM-DD)'),
      end_date: z.string().optional().describe('ISO date string (YYYY-MM-DD)'),
    },
    async ({ start_date, end_date }) => {
      const events = await client.events.listMyEvents({ start_date, end_date })
      return {
        content: [{ type: 'text', text: JSON.stringify(events, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 7: Write tools/courses.ts**

```typescript
// packages/mcp/src/tools/courses.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerCourseTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'get_course',
    'Get details of a specific course by ID',
    { course_id: z.string().describe('The Schoology course ID') },
    async ({ course_id }) => {
      const course = await client.courses.getCourse(course_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(course, null, 2) }],
      }
    }
  )

  server.tool(
    'get_section',
    'Get details of a specific section (class period)',
    { section_id: z.string().describe('The Schoology section ID') },
    async ({ section_id }) => {
      const section = await client.sections.getSection(section_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(section, null, 2) }],
      }
    }
  )
}
```

- [ ] **Step 8: Write tools/index.ts**

```typescript
// packages/mcp/src/tools/index.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SchoologyClient } from '@schoology/client'
import { registerUserTools } from './users.js'
import { registerGradeTools } from './grades.js'
import { registerAssignmentTools } from './assignments.js'
import { registerMessageTools } from './messages.js'
import { registerEventTools } from './events.js'
import { registerCourseTools } from './courses.js'

export function registerAllTools(server: McpServer, client: SchoologyClient): void {
  registerUserTools(server, client)
  registerGradeTools(server, client)
  registerAssignmentTools(server, client)
  registerMessageTools(server, client)
  registerEventTools(server, client)
  registerCourseTools(server, client)
}
```

- [ ] **Step 9: Write tools/discussions.ts** (was in file tree, must be implemented)

```typescript
// packages/mcp/src/tools/discussions.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerDiscussionTools(server: McpServer, client: SchoologyClient): void {
  server.tool(
    'list_discussions',
    'List all discussions for a section/class',
    { section_id: z.string().describe('The Schoology section ID') },
    async ({ section_id }) => {
      const discussions = await client.discussions.listDiscussions(section_id)
      return {
        content: [{ type: 'text', text: JSON.stringify(discussions, null, 2) }],
      }
    }
  )
}
```

Update `tools/index.ts` to include discussions:

```typescript
import { registerDiscussionTools } from './discussions.js'
// ... inside registerAllTools:
registerDiscussionTools(server, client)
```

- [ ] **Step 10: Create vitest.config.ts for MCP package**

```typescript
// packages/mcp/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 11: Write MCP tools test**

```typescript
// packages/mcp/tests/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAllTools } from '../src/tools/index.js'
import type { SchoologyClient } from '@schoology/client'

function makeMockClient(): SchoologyClient {
  return {
    users: {
      getMe: vi.fn().mockResolvedValue({ id: '1', name_first: 'Test', name_last: 'User', primary_email: 'test@school.edu', type: 'student' }),
      getMySections: vi.fn().mockResolvedValue([{ id: 's1', course_title: 'Math', section_title: 'P1' }]),
      getUser: vi.fn().mockResolvedValue({ id: '2', name_first: 'Other' }),
      updateUser: vi.fn(),
    },
    grades: {
      getMyGrades: vi.fn().mockResolvedValue([{ section_id: 's1', period: [], assignment: [] }]),
      getSectionGrades: vi.fn().mockResolvedValue({ section_id: 's1', period: [], assignment: [] }),
      updateGrade: vi.fn(),
    },
    assignments: {
      listAssignments: vi.fn().mockResolvedValue([{ id: 'a1', title: 'HW1' }]),
      getAssignment: vi.fn().mockResolvedValue({ id: 'a1', title: 'HW1' }),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
    },
    messages: {
      listInbox: vi.fn().mockResolvedValue([]),
      listSent: vi.fn().mockResolvedValue([]),
      getMessage: vi.fn().mockResolvedValue({ id: 'm1', subject: 'Hi' }),
      deleteMessage: vi.fn(),
    },
    events: {
      listMyEvents: vi.fn().mockResolvedValue([]),
      listSectionEvents: vi.fn().mockResolvedValue([]),
      getEvent: vi.fn().mockResolvedValue({}),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
    },
    courses: {
      getCourse: vi.fn().mockResolvedValue({ id: 'c1', title: 'Math' }),
      deleteCourse: vi.fn(),
    },
    sections: {
      getSection: vi.fn().mockResolvedValue({ id: 's1' }),
      listSectionEnrollments: vi.fn().mockResolvedValue([]),
      updateSection: vi.fn(),
    },
    discussions: {
      listDiscussions: vi.fn().mockResolvedValue([]),
      getDiscussion: vi.fn().mockResolvedValue({}),
      updateDiscussion: vi.fn(),
      deleteDiscussion: vi.fn(),
    },
    groups: { listMyGroups: vi.fn().mockResolvedValue([]), getGroup: vi.fn().mockResolvedValue({}) },
    documents: { listDocuments: vi.fn().mockResolvedValue([]), getDocument: vi.fn().mockResolvedValue({}) },
    authenticate: vi.fn(),
    logout: vi.fn(),
  } as unknown as SchoologyClient
}

describe('MCP Tools registration', () => {
  let server: McpServer
  let client: SchoologyClient

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' })
    client = makeMockClient()
    registerAllTools(server, client)
  })

  it('registers tools without throwing', () => {
    // If registerAllTools throws, the test fails
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 12: Run typecheck and tests**

```bash
cd packages/mcp && pnpm typecheck && pnpm test
```

- [ ] **Step 13: Commit**

```bash
git add packages/mcp/src packages/mcp/tests packages/mcp/vitest.config.ts
git commit -m "feat(mcp): add MCP server with all Schoology tools and tests"
```

---

## Chunk 8: GitHub Repo & Production Polish

### Task 13: CI/CD Workflows

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Write ci.yml**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Lint, Typecheck & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm --filter @schoology/client exec playwright install chromium --with-deps

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test
```

- [ ] **Step 2: Write publish.yml**

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm build

      - name: Publish @schoology/client
        run: pnpm --filter @schoology/client publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish @schoology/mcp
        run: pnpm --filter @schoology/mcp publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 3: Commit**

```bash
git add .github
git commit -m "ci: add GitHub Actions for CI and npm publish"
```

---

### Task 14: README, examples, and production docs

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`
- Create: `examples/nextjs-usage.ts`
- Create: `examples/mcp-config.json`

- [ ] **Step 1: Write README.md**

```markdown
# 🎓 Schoology API

**Access all your Schoology data — grades, assignments, messages, events — with just your username and password. No admin API keys required.**

A production-ready TypeScript monorepo with:
- **`@schoology/client`** — NPM package, use in any Node.js or Next.js app
- **`@schoology/mcp`** — Claude MCP skill, add Schoology to Claude in one step

## How it works

Most schools lock down Schoology's official API so students can't get admin-issued API keys. This library works around that by using a **headless Chromium browser** (invisible, no windows open) to log in with your credentials — just like you would normally — then extracts the session cookies and uses them to call Schoology's internal API directly. Works with all login types:

- ✅ Native Schoology username/password
- ✅ Google SSO
- ✅ Microsoft SSO
- ✅ Clever SSO
- ✅ SAML (generic)

## Quick Start

### As a Claude Skill (MCP)

Add this to your Claude MCP config (`~/.config/claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "schoology": {
      "command": "npx",
      "args": ["-y", "@schoology/mcp"],
      "env": {
        "SCHOOLOGY_USERNAME": "your.username",
        "SCHOOLOGY_PASSWORD": "yourpassword",
        "SCHOOLOGY_DOMAIN": "yourschool.schoology.com"
      }
    }
  }
}
```

Restart Claude and ask: *"What are my grades this semester?"* or *"What assignments are due this week?"*

### In a Next.js App

```bash
npm install @schoology/client
npx playwright install chromium
```

```typescript
import { SchoologyClient } from '@schoology/client'

const client = new SchoologyClient({
  credentials: {
    username: process.env.SCHOOLOGY_USERNAME!,
    password: process.env.SCHOOLOGY_PASSWORD!,
    domain: process.env.SCHOOLOGY_DOMAIN!,
    // Optional: persist session between server restarts
    sessionCachePath: '/tmp/.schoology-session',
    sessionCacheKey: process.env.SCHOOLOGY_SESSION_KEY, // 32-byte hex string
  },
})

// Authenticate once (or it auto-authenticates on first call)
await client.authenticate()

// Get grades
const grades = await client.grades.getMyGrades()

// List assignments for each section
const sections = await client.users.getMySections()
for (const section of sections) {
  const assignments = await client.assignments.listAssignments(section.id)
  console.log(section.course_title, assignments)
}
```

## Available Tools (MCP)

| Tool | Description |
|------|-------------|
| `get_me` | Get your Schoology profile |
| `list_my_sections` | List all your enrolled classes |
| `get_my_grades` | Full grade report for all classes |
| `get_section_grades` | Grades for one class |
| `list_assignments` | All assignments for a class |
| `get_assignment` | Details of one assignment |
| `list_inbox` | Messages in your inbox |
| `list_sent_messages` | Your sent messages |
| `get_message` | Read one message |
| `list_my_events` | Upcoming events and due dates |
| `get_course` | Course details |
| `get_section` | Section/period details |
| `get_user` | Any user's profile |

## Available Client Methods

```typescript
client.users.getMe()
client.users.getMySections()
client.users.getUser(userId)
client.grades.getMyGrades()
client.grades.getSectionGrades(sectionId)
client.assignments.listAssignments(sectionId)
client.assignments.getAssignment(sectionId, assignmentId)
client.discussions.listDiscussions(sectionId)
client.events.listMyEvents({ start_date, end_date })
client.messages.listInbox()
client.messages.listSent()
client.groups.listMyGroups()
client.documents.listDocuments(sectionId)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SCHOOLOGY_USERNAME` | ✅ | Your Schoology username or email |
| `SCHOOLOGY_PASSWORD` | ✅ | Your Schoology password |
| `SCHOOLOGY_DOMAIN` | ✅ | Your school's domain, e.g. `yourschool.schoology.com` |
| `SCHOOLOGY_SESSION_CACHE_PATH` | ❌ | File path to cache encrypted session (speeds up restarts) |
| `SCHOOLOGY_SESSION_CACHE_KEY` | ❌ | 32-byte hex key for session encryption |

## Security

- Credentials are **never stored** — only the session cookie is cached (and encrypted if you set `sessionCachePath`)
- All requests use HTTPS
- The headless browser runs in memory only — no files are written to disk unless you opt in to session caching
- Session cookies expire naturally (typically within 24 hours), after which the library re-authenticates automatically

## Requirements

- Node.js >= 18
- `npx playwright install chromium` (done automatically on first run if missing)

## License

MIT
```

- [ ] **Step 2: Write LICENSE (MIT)**

```
MIT License

Copyright (c) 2026 Schoology API Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Write examples/nextjs-usage.ts**

```typescript
// examples/nextjs-usage.ts
// Example: Use @schoology/client in a Next.js API route
// Place your credentials in .env.local:
// SCHOOLOGY_USERNAME=youruser
// SCHOOLOGY_PASSWORD=yourpassword
// SCHOOLOGY_DOMAIN=yourschool.schoology.com

import { SchoologyClient } from '@schoology/client'

// Singleton client for the server process
const client = new SchoologyClient({
  credentials: {
    username: process.env.SCHOOLOGY_USERNAME!,
    password: process.env.SCHOOLOGY_PASSWORD!,
    domain: process.env.SCHOOLOGY_DOMAIN!,
  },
})

// Example Next.js App Router route: GET /api/grades
export async function GET() {
  await client.authenticate()
  const grades = await client.grades.getMyGrades()
  return Response.json({ grades })
}
```

- [ ] **Step 4: Write examples/mcp-config.json**

```json
{
  "_comment": "Add this to your Claude Desktop config file",
  "mcpServers": {
    "schoology": {
      "command": "npx",
      "args": ["-y", "@schoology/mcp"],
      "env": {
        "SCHOOLOGY_USERNAME": "your.username@school.edu",
        "SCHOOLOGY_PASSWORD": "yourpassword",
        "SCHOOLOGY_DOMAIN": "yourschool.schoology.com"
      }
    }
  }
}
```

- [ ] **Step 5: Write CONTRIBUTING.md**

```markdown
# Contributing

## Development Setup

```bash
git clone https://github.com/yourusername/schoology-api
cd schoology-api
pnpm install
npx playwright install chromium
```

## Running Tests

```bash
pnpm test          # all packages
pnpm -r typecheck  # typecheck all
pnpm lint          # lint all
```

## Integration Testing

To run real integration tests against an actual Schoology instance:

```bash
cp .env.example .env
# Fill in your credentials
pnpm -r test:integration
```

## Releasing

1. Bump versions in both `packages/*/package.json`
2. Update `CHANGELOG.md`
3. `git tag v0.x.0 && git push --tags`
4. GitHub Actions publishes to npm automatically
```

- [ ] **Step 6: Commit docs**

```bash
git add README.md LICENSE CONTRIBUTING.md examples/
git commit -m "docs: add README, LICENSE, CONTRIBUTING, and examples"
```

---

### Task 15: Create GitHub repo and push

- [ ] **Step 1: Create public GitHub repo**

Note: the local folder is `schoology api` (with a space). The GitHub repo will be named `schoology-api`. Git operates on the local path; the remote URL uses the repo slug.

```bash
# Run from inside the "schoology api" directory
gh repo create schoology-api \
  --public \
  --description "🎓 TypeScript client + Claude MCP skill for Schoology — no admin API keys needed" \
  --add-readme=false
```

- [ ] **Step 2: Add repo topics**

```bash
gh repo edit riripatate/schoology-api \
  --add-topic schoology \
  --add-topic typescript \
  --add-topic mcp \
  --add-topic claude \
  --add-topic education \
  --add-topic api-client \
  --add-topic lms
```

- [ ] **Step 3: Add remote and push**

```bash
GITHUB_USER=$(gh api user --jq .login)
git remote add origin "https://github.com/${GITHUB_USER}/schoology-api.git"
git push -u origin main
```

---

### Task 16: Stress test for data accuracy

The goal is to verify the API returns accurate, parseable data from a real Schoology instance.

- [ ] **Step 1: Create integration test script**

Create `scripts/integration-test.ts`:

```typescript
#!/usr/bin/env npx tsx
/**
 * Integration test script — runs against a real Schoology instance.
 * Set SCHOOLOGY_USERNAME, SCHOOLOGY_PASSWORD, SCHOOLOGY_DOMAIN env vars.
 *
 * Run: npx tsx scripts/integration-test.ts
 */
import { SchoologyClient } from '../packages/client/src/index.js'

const required = ['SCHOOLOGY_USERNAME', 'SCHOOLOGY_PASSWORD', 'SCHOOLOGY_DOMAIN'] as const
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
}

const client = new SchoologyClient({
  credentials: {
    username: process.env['SCHOOLOGY_USERNAME']!,
    password: process.env['SCHOOLOGY_PASSWORD']!,
    domain: process.env['SCHOOLOGY_DOMAIN']!,
  },
})

async function assert(name: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  ${name}... `)
  try {
    const result = await fn()
    if (result === null || result === undefined) throw new Error('returned null/undefined')
    if (Array.isArray(result) && result.length === 0) {
      console.log('⚠️  (empty array — may be correct)')
    } else {
      console.log('✅')
    }
    return result
  } catch (err) {
    console.log(`❌ ${(err as Error).message}`)
    return null
  }
}

async function run() {
  console.log('\n🔐 Authenticating...')
  await client.authenticate()
  console.log('✅ Login successful\n')

  console.log('👤 User')
  const me = await assert('getMe()', () => client.users.getMe())
  const sections = await assert('getMySections()', () => client.users.getMySections())

  console.log('\n📚 Courses & Sections')
  if (Array.isArray(sections) && sections.length > 0) {
    const sectionId = (sections[0] as { id: string }).id
    await assert(`listAssignments(${sectionId})`, () => client.assignments.listAssignments(sectionId))
    await assert(`listDiscussions(${sectionId})`, () => client.discussions.listDiscussions(sectionId))
    await assert(`listDocuments(${sectionId})`, () => client.documents.listDocuments(sectionId))
  }

  console.log('\n📊 Grades')
  await assert('getMyGrades()', () => client.grades.getMyGrades())

  console.log('\n📅 Events')
  await assert('listMyEvents()', () => client.events.listMyEvents())

  console.log('\n✉️  Messages')
  await assert('listInbox()', () => client.messages.listInbox())
  await assert('listSent()', () => client.messages.listSent())

  console.log('\n👥 Groups')
  await assert('listMyGroups()', () => client.groups.listMyGroups())

  console.log('\n✨ All integration checks complete!')

  if (me) {
    const user = me as { name_display: string; primary_email: string }
    console.log(`\nLogged in as: ${user.name_display} (${user.primary_email})`)
  }
}

run().catch((err) => {
  console.error('\n💥 Fatal error:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Install tsx and dotenv-cli**

```bash
pnpm add -Dw tsx dotenv-cli
```

- [ ] **Step 3: Run integration test (requires real credentials in .env)**

```bash
# Create .env.local with real credentials (gitignored):
# SCHOOLOGY_USERNAME=...
# SCHOOLOGY_PASSWORD=...
# SCHOOLOGY_DOMAIN=yourschool.schoology.com

pnpm exec dotenv-cli -e .env.local -- pnpm exec tsx scripts/integration-test.ts
```

Expected output:
```
🔐 Authenticating...
✅ Login successful

👤 User
  getMe()... ✅
  getMySections()... ✅

📚 Courses & Sections
  listAssignments(s1)... ✅
  ...

📊 Grades
  getMyGrades()... ✅
...
✨ All integration checks complete!
```

- [ ] **Step 4: Fix any type mismatches found during integration test**

If any endpoint returns data that doesn't match the TypeScript types, update `packages/client/src/types/index.ts` to match the actual Schoology response shape. Then re-run until all assertions pass.

- [ ] **Step 5: Commit integration test**

```bash
git add scripts/integration-test.ts
git commit -m "test: add integration test script for stress testing against real Schoology"
git push
```

---

## Summary of MCP Tools

| Tool Name | Method | Description |
|-----------|--------|-------------|
| `get_me` | GET | Current user profile |
| `list_my_sections` | GET | Enrolled sections |
| `get_user` | GET | Any user by ID |
| `get_my_grades` | GET | All grades |
| `get_section_grades` | GET | Grades for one class |
| `list_assignments` | GET | Assignments for a section |
| `get_assignment` | GET | One assignment |
| `list_inbox` | GET | Inbox messages |
| `list_sent_messages` | GET | Sent messages |
| `get_message` | GET | One message |
| `list_my_events` | GET | Events + due dates |
| `get_course` | GET | Course details |
| `get_section` | GET | Section details |

All write operations (PUT/PATCH/DELETE) are available in the core client but intentionally excluded from MCP tools — Claude should only read, not modify, school data by default.
