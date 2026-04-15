import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerMessageTools(server: McpServer, client: SchoologyClient): void {
  server.tool('list_inbox', 'List all messages in the inbox', {}, async () => {
    const messages = await client.messages.listInbox()
    return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] }
  })

  server.tool('list_sent_messages', 'List all sent messages', {}, async () => {
    const messages = await client.messages.listSent()
    return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] }
  })

  server.tool('get_message', 'Get a specific message by ID', { message_id: z.string().describe('The message ID') }, async ({ message_id }) => {
    const message = await client.messages.getMessage(message_id)
    return { content: [{ type: 'text', text: JSON.stringify(message, null, 2) }] }
  })
}
