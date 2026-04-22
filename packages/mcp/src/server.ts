import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SchoologyClient } from '@schoology/client'
import { registerAllTools } from './tools/index.js'

function getCredentials() {
  const username = process.env['SCHOOLOGY_USERNAME']
  const password = process.env['SCHOOLOGY_PASSWORD']
  if (!username || !password) {
    throw new Error(
      'Missing required env vars: SCHOOLOGY_USERNAME, SCHOOLOGY_PASSWORD'
    )
  }
  return {
    username,
    password,
    domain: process.env['SCHOOLOGY_DOMAIN'],
    sessionCachePath: process.env['SCHOOLOGY_SESSION_CACHE_PATH'],
    sessionCacheKey: process.env['SCHOOLOGY_SESSION_CACHE_KEY'],
  }
}

export async function startServer(): Promise<void> {
  const credentials = getCredentials()
  const client = new SchoologyClient({ credentials })
  await client.authenticate()

  const server = new McpServer({ name: 'schoology', version: '0.1.0' })
  registerAllTools(server, client)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Schoology MCP server running —', credentials.domain)
}
