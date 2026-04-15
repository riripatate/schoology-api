import type { SessionCookies } from '../auth/headless-login.js'

export class SchoologyHttpClient {
  private readonly baseURL: string
  private session: SessionCookies | null = null
  private onSessionExpired?: () => Promise<SessionCookies>
  private readonly timeout: number

  constructor(
    domain: string,
    options: {
      timeout?: number
      onSessionExpired?: () => Promise<SessionCookies>
    } = {}
  ) {
    this.baseURL = `https://${domain}/api/v1`
    this.timeout = options.timeout ?? 30000
    this.onSessionExpired = options.onSessionExpired
  }

  setSession(session: SessionCookies): void {
    this.session = session
  }

  private buildCookieHeader(): string {
    if (!this.session) return ''
    return this.session.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
    const cookie = this.buildCookieHeader()
    if (cookie) headers['Cookie'] = cookie
    return headers
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string | number | boolean>; body?: unknown } = {}
  ): Promise<T> {
    let url = `${this.baseURL}${path}`
    if (options.params && Object.keys(options.params).length > 0) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(options.params).map(([k, v]) => [k, String(v)]))
      )
      url = `${url}?${qs.toString()}`
    }

    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), this.timeout)

    const fetchOptions: RequestInit = {
      method,
      headers: this.buildHeaders(),
      signal: controller.signal,
    }
    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    let response: Response
    try {
      response = await fetch(url, fetchOptions)
    } finally {
      clearTimeout(timerId)
    }

    if (response.status === 401 && this.onSessionExpired) {
      this.session = await this.onSessionExpired()
      return this.request<T>(method, path, options)
    }

    if (!response.ok) {
      let errMsg = response.statusText
      try {
        const data = (await response.json()) as { error?: { message?: string } }
        if (data?.error?.message) errMsg = data.error.message
      } catch {
        // ignore parse error
      }
      throw new Error(`Schoology API error ${response.status}: ${errMsg}`)
    }

    return response.json() as Promise<T>
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', path, { params })
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body: data })
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body: data })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }
}
