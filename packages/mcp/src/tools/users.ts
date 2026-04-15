import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerUserTools(server: McpServer, client: SchoologyClient): void {
  server.tool('get_me', 'Get the profile of the currently authenticated Schoology user', {}, async () => {
    const user = await client.users.getMe()
    return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] }
  })

  server.tool('list_my_sections', 'List all sections (classes) the current user is enrolled in', {}, async () => {
    const sections = await client.users.getMySections()
    return { content: [{ type: 'text', text: JSON.stringify(sections, null, 2) }] }
  })

  server.tool('get_user', 'Get a Schoology user by their ID', { user_id: z.string().describe('The Schoology user ID') }, async ({ user_id }) => {
    const user = await client.users.getUser(user_id)
    return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] }
  })
}
