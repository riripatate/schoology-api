import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoologymcp/client'

export function registerDiscussionTools(server: McpServer, client: SchoologyClient): void {
  server.tool('list_discussions', 'List all discussions for a section/class', { section_id: z.string().describe('The Schoology section ID') }, async ({ section_id }) => {
    const discussions = await client.discussions.listDiscussions(section_id)
    return { content: [{ type: 'text', text: JSON.stringify(discussions, null, 2) }] }
  })
}
