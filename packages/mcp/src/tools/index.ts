import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SchoologyClient } from '@schoology/client'
import { registerUserTools } from './users.js'
import { registerGradeTools } from './grades.js'
import { registerAssignmentTools } from './assignments.js'
import { registerMessageTools } from './messages.js'
import { registerEventTools } from './events.js'
import { registerCourseTools } from './courses.js'
import { registerDiscussionTools } from './discussions.js'

export function registerAllTools(server: McpServer, client: SchoologyClient): void {
  registerUserTools(server, client)        // get_me, list_my_sections, get_user (3)
  registerGradeTools(server, client)       // get_my_grades, get_section_grades (2)
  registerAssignmentTools(server, client)  // list_assignments, get_assignment (2)
  registerMessageTools(server, client)     // list_inbox, list_sent_messages, get_message (3)
  registerEventTools(server, client)       // list_my_events (1)
  registerCourseTools(server, client)      // get_course, get_section (2)
  registerDiscussionTools(server, client)  // list_discussions (1)
  // Total: 14 tools
}
