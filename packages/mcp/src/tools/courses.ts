import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'
import type { SchoologyClient } from '@schoologymcp/client'

export function registerCourseTools(server: McpServer, client: SchoologyClient): void {
  server.tool('get_course', 'Get details of a specific course by ID', { course_id: z.string().describe('The Schoology course ID') }, async ({ course_id }) => {
    const course = await client.courses.getCourse(course_id)
    return { content: [{ type: 'text', text: JSON.stringify(course, null, 2) }] }
  })

  server.tool('get_section', 'Get details of a specific section (class period)', { section_id: z.string().describe('The Schoology section ID') }, async ({ section_id }) => {
    const section = await client.sections.getSection(section_id)
    return { content: [{ type: 'text', text: JSON.stringify(section, null, 2) }] }
  })
}
