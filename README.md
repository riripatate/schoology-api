# 🎓 Schoology API

**Access all your Schoology data — grades, assignments, messages, events — with just your username and password. No admin API keys required.**

[![CI](https://github.com/riripatate/schoology-api/actions/workflows/ci.yml/badge.svg)](https://github.com/riripatate/schoology-api/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schoology/client)](https://www.npmjs.com/package/@schoology/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready TypeScript monorepo with:
- **`@schoology/client`** — NPM package, import in any Node.js or Next.js app
- **`@schoology/mcp`** — Claude MCP skill, add Schoology to Claude in one line

## How it works

Most schools lock down Schoology's official API so students can't get admin-issued API keys. This library works around that by using a **headless Chromium browser** (invisible — no windows open) to log in with your credentials, then extracts the session cookies and uses them to call Schoology's internal API directly.

Works with all login types:
- ✅ Native Schoology username/password
- ✅ Google SSO
- ✅ Microsoft SSO
- ✅ Clever SSO
- ✅ Generic SAML

## Quick Start

### As a Claude MCP Skill

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### In a Next.js / Node.js App

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
    domain: process.env.SCHOOLOGY_DOMAIN!, // e.g. "yourschool.schoology.com"
  },
})

await client.authenticate()

// Get all grades
const grades = await client.grades.getMyGrades()

// List classes and their assignments
const sections = await client.users.getMySections()
for (const section of sections) {
  const assignments = await client.assignments.listAssignments(section.id)
  console.log(section.course_title, assignments.length, 'assignments')
}

// Read messages
const inbox = await client.messages.listInbox()
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_me` | Your Schoology profile |
| `list_my_sections` | All enrolled classes |
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
| `list_discussions` | Discussions for a class |

## Client API

```typescript
// User
client.users.getMe()
client.users.getMySections()
client.users.getUser(userId)

// Grades
client.grades.getMyGrades()
client.grades.getSectionGrades(sectionId)

// Assignments
client.assignments.listAssignments(sectionId)
client.assignments.getAssignment(sectionId, assignmentId)

// Events / Calendar
client.events.listMyEvents({ start_date: '2026-04-01', end_date: '2026-06-30' })

// Messages
client.messages.listInbox()
client.messages.listSent()
client.messages.getMessage(messageId)

// Discussions, Documents, Groups
client.discussions.listDiscussions(sectionId)
client.documents.listDocuments(sectionId)
client.groups.listMyGroups()
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SCHOOLOGY_USERNAME` | ✅ | Your Schoology username or email |
| `SCHOOLOGY_PASSWORD` | ✅ | Your Schoology password |
| `SCHOOLOGY_DOMAIN` | ✅ | Your school's domain, e.g. `yourschool.schoology.com` |
| `SCHOOLOGY_SESSION_CACHE_PATH` | ❌ | File path to cache encrypted session (avoids re-login on restart) |
| `SCHOOLOGY_SESSION_CACHE_KEY` | ❌ | 32-byte hex string for AES-256 session encryption |

## Session Caching (optional)

To avoid a full browser login on every restart:

```typescript
const client = new SchoologyClient({
  credentials: {
    username: '...',
    password: '...',
    domain: '...',
    sessionCachePath: '/tmp/.schoology-session',
    sessionCacheKey: process.env.SESSION_KEY, // 64 hex chars = 32 bytes
  },
})
```

Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Sessions are encrypted with AES-256-CBC and expire automatically after 12 hours.

## Security

- Credentials are **never stored** — only the encrypted session cookie is cached on disk (opt-in)
- All requests use HTTPS
- The headless browser runs entirely in memory
- Sessions auto-expire after 12 hours; the library re-authenticates transparently

## Requirements

- Node.js >= 18
- Playwright Chromium: `npx playwright install chromium`

## License

MIT
