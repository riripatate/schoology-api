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

  async authenticate(force = false): Promise<SessionCookies> {
    if (!force) {
      const cached = getSession(this.sessionKey)
      if (cached && isSessionFresh(cached)) {
        this.httpClient.setSession(cached)
        return cached
      }
      const { credentials } = this.options
      if (credentials.sessionCachePath && credentials.sessionCacheKey) {
        const persisted = loadPersistedSession(credentials.sessionCachePath, credentials.sessionCacheKey)
        if (persisted && isSessionFresh(persisted)) {
          this.httpClient.setSession(persisted)
          storeSession(this.sessionKey, persisted)
          return persisted
        }
      }
    }

    const session = await login(this.options.credentials)
    storeSession(this.sessionKey, session)
    this.httpClient.setSession(session)

    const { credentials } = this.options
    if (credentials.sessionCachePath && credentials.sessionCacheKey) {
      persistSession(session, credentials.sessionCachePath, credentials.sessionCacheKey)
    }
    return session
  }

  logout(): void {
    clearSession(this.sessionKey)
  }
}
