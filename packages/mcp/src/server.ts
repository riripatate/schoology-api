import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SchoologyClient } from '@schoologymcp/client'
import { loadCredentials } from './credentials.js'
import { registerAllTools } from './tools/index.js'

async function ensureChromium() {
  try {
    const { chromium } = await import('playwright')
    const executablePath = chromium.executablePath()
    if (!existsSync(executablePath)) throw new Error('not installed')
  } catch {
    console.error('Installing Chromium (one-time, ~150MB)…')
    execSync('npx playwright install chromium', { stdio: 'inherit' })
  }
}

export async function startServer(): Promise<void> {
  await ensureChromium()
  const credentials = await loadCredentials()
  const client = new SchoologyClient({ credentials })
  await client.authenticate()

  const server = new McpServer({ name: 'schoology', version: '0.1.0' })
  registerAllTools(server, client)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Schoology MCP server running —', credentials.domain)
}
