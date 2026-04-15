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
    sameSite: 'Strict' | 'Lax' | 'None'
  }>
  capturedAt: number
  domain: string
}

async function detectLoginType(
  page: Page
): Promise<'native' | 'google' | 'microsoft' | 'clever' | 'saml'> {
  const url = page.url()
  if (url.includes('accounts.google.com')) return 'google'
  if (url.includes('login.microsoftonline.com') || url.includes('login.live.com'))
    return 'microsoft'
  if (url.includes('clever.com')) return 'clever'
  if (!url.includes('schoology.com') && !url.includes('schoology')) return 'saml'
  return 'native'
}

async function handleGoogleLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('input[type="email"]', username)
  await page.click('#identifierNext, [data-action="next"]')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="password"]', password)
  await page.click('#passwordNext, [data-action="next"]')
  await page.waitForLoadState('networkidle')
}

async function handleMicrosoftLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('input[type="email"], input[name="loginfmt"]', username)
  await page.click('input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="password"], input[name="passwd"]', password)
  await page.click('input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
  const keepSignedIn = page.locator('#KmsiCheckboxField, input[name="DontShowAgain"]')
  if (await keepSignedIn.isVisible()) {
    await page.click('input[type="submit"][value="No"], button:has-text("No")')
    await page.waitForLoadState('networkidle')
  }
}

async function handleCleverLogin(page: Page, username: string, password: string): Promise<void> {
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

async function handleNativeLogin(page: Page, username: string, password: string): Promise<void> {
  await page.fill('#username, input[name="mail"]', username)
  await page.fill('#password, input[name="pass"]', password)
  await page.click('#login-submit, input[type="submit"], button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

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
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 })

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

    await page
      .waitForURL(
        (url) =>
          url.href.includes('/home') ||
          url.href.includes('/dashboard') ||
          url.href.includes('/course'),
        { timeout: 30000 }
      )
      .catch(() => {
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
        sameSite: (c.sameSite ?? 'None') as 'Strict' | 'Lax' | 'None',
      })),
      capturedAt: Date.now(),
      domain,
    }
  } finally {
    await context?.close()
    await browser.close()
  }
}

export function isSessionFresh(session: SessionCookies): boolean {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000
  return Date.now() - session.capturedAt < TWELVE_HOURS
}
