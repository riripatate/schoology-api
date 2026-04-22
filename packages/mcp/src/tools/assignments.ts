import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoologymcp/client'

export function registerAssignmentTools(server: McpServer, client: SchoologyClient): void {
  server.tool('list_assignments', 'List all assignments for a section/class', { section_id: z.string().describe('The Schoology section ID') }, async ({ section_id }) => {
    const assignments = await client.assignments.listAssignments(section_id)
    return { content: [{ type: 'text', text: JSON.stringify(assignments, null, 2) }] }
  })

  server.tool('get_assignment', 'Get details of a specific assignment', { section_id: z.string().describe('The section ID'), assignment_id: z.string().describe('The assignment ID') }, async ({ section_id, assignment_id }) => {
    const assignment = await client.assignments.getAssignment(section_id, assignment_id)
    return { content: [{ type: 'text', text: JSON.stringify(assignment, null, 2) }] }
  })
}
