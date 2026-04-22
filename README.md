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

> Ask me for my Schoology username and password, then run `claude mcp add schoology -- npx -y @schoology/mcp` with `-e SCHOOLOGY_USERNAME=<username> -e SCHOOLOGY_PASSWORD=<password>`. Chromium installs automatically on first use. Confirm it's working by listing my classes.

<br />

### <img src="https://claude.ai/favicon.ico" width="18" /> &nbsp; Cowork

Open Cowork and paste:

> Ask me for my Schoology username and password, then add `npx -y @schoology/mcp` to my Cowork MCP config with `SCHOOLOGY_USERNAME` and `SCHOOLOGY_PASSWORD` as env vars. Verify it works by fetching my grades.

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
