import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerEventTools(server: McpServer, client: SchoologyClient): void {
  server.tool('list_my_events', 'List upcoming events and assignment due dates for the current user', { start_date: z.string().optional().describe('ISO date YYYY-MM-DD'), end_date: z.string().optional().describe('ISO date YYYY-MM-DD') }, async ({ start_date, end_date }) => {
    const events = await client.events.listMyEvents({ start_date, end_date })
    return { content: [{ type: 'text', text: JSON.stringify(events, null, 2) }] }
  })
}
