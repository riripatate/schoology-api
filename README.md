<div align="center">

# 🎓 Schoology

**Your grades, assignments, and messages — in Claude.**

[![CI](https://github.com/riripatate/schoology-api/actions/workflows/ci.yml/badge.svg)](https://github.com/riripatate/schoology-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Log in once with your username and password. Ask Claude anything about your classes.

</div>

---

## Install

Pick your Claude. Copy the prompt. Paste it. Done.

<br />

### <img src="https://claude.ai/favicon.ico" width="18" /> &nbsp; Claude Code

Open Claude Code and paste:

> Install the Schoology MCP server from `https://github.com/riripatate/schoology-api`. Clone it to `~/.claude/mcp/schoology-api`, run `pnpm install && pnpm build && npx playwright install chromium` inside it, then ask me for my Schoology username and password and register it with `claude mcp add schoology -- node ~/.claude/mcp/schoology-api/packages/mcp/dist/index.js -e SCHOOLOGY_USERNAME=... -e SCHOOLOGY_PASSWORD=...`. Confirm it's working by listing my classes.

<br />

### <img src="https://claude.ai/favicon.ico" width="18" /> &nbsp; Cowork

Open Cowork and paste:

> Install the Schoology MCP server from `https://github.com/riripatate/schoology-api`. Clone the repo locally, run `pnpm install && pnpm build && npx playwright install chromium`, then prompt me for my Schoology username and password and add it to my Cowork MCP config pointing at `packages/mcp/dist/index.js` with those credentials as env vars. Verify it works by fetching my grades.

<br />

---

## What you can ask

- *What are my grades this semester?*
- *What's due this week?*
- *Summarize my unread messages.*
- *When's my next math test?*
- *Which classes am I doing worst in?*

## What it can do

| | |
|---|---|
| 📊 Grades | Full report across all classes |
| 📝 Assignments | Due dates, descriptions, status |
| 💬 Messages | Inbox, sent, read threads |
| 📅 Calendar | Upcoming events and deadlines |
| 🏫 Classes | Sections, courses, discussions |
| 👥 Groups | Memberships and group content |

## Requirements

- Claude Code or Cowork
- Your Schoology username and password
- Node.js 18+

That's it. No API keys. No admin access.

## How it works

Most schools lock down Schoology's official API. This skill logs in as you — in an invisible browser — captures the session, and queries Schoology directly. Your password is never stored. Sessions are encrypted and expire in 12 hours.

Works with native logins, Google SSO, Microsoft SSO, Clever, and SAML.

## License

MIT
