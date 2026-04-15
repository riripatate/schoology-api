import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoology/client'

export function registerGradeTools(server: McpServer, client: SchoologyClient): void {
  server.tool('get_my_grades', 'Get the full grade report for all sections of the current user, including period grades and individual assignment grades', {}, async () => {
    const grades = await client.grades.getMyGrades()
    return { content: [{ type: 'text', text: JSON.stringify(grades, null, 2) }] }
  })

  server.tool('get_section_grades', 'Get detailed grades for a specific section/class', { section_id: z.string().describe('The Schoology section ID') }, async ({ section_id }) => {
    const grades = await client.grades.getSectionGrades(section_id)
    return { content: [{ type: 'text', text: JSON.stringify(grades, null, 2) }] }
  })
}
