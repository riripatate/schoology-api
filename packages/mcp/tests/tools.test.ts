import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAllTools } from '../src/tools/index.js'
import type { SchoologyClient } from '@schoology/client'

function makeMockClient(): SchoologyClient {
  return {
    users: {
      getMe: vi.fn().mockResolvedValue({ id: '1', name_first: 'Test', name_last: 'User', primary_email: 'test@school.edu', type: 'student' }),
      getMySections: vi.fn().mockResolvedValue([{ id: 's1', course_title: 'Math', section_title: 'P1' }]),
      getUser: vi.fn().mockResolvedValue({ id: '2', name_first: 'Other' }),
      updateUser: vi.fn(),
    },
    grades: {
      getMyGrades: vi.fn().mockResolvedValue([]),
      getSectionGrades: vi.fn().mockResolvedValue({ section_id: 's1', period: [], assignment: [] }),
      updateGrade: vi.fn(),
    },
    assignments: {
      listAssignments: vi.fn().mockResolvedValue([]),
      getAssignment: vi.fn().mockResolvedValue({ id: 'a1', title: 'HW1' }),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
    },
    messages: {
      listInbox: vi.fn().mockResolvedValue([]),
      listSent: vi.fn().mockResolvedValue([]),
      getMessage: vi.fn().mockResolvedValue({ id: 'm1', subject: 'Hi' }),
      deleteMessage: vi.fn(),
    },
    events: {
      listMyEvents: vi.fn().mockResolvedValue([]),
      listSectionEvents: vi.fn().mockResolvedValue([]),
      getEvent: vi.fn().mockResolvedValue({}),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
    },
    courses: {
      getCourse: vi.fn().mockResolvedValue({ id: 'c1', title: 'Math' }),
      deleteCourse: vi.fn(),
    },
    sections: {
      getSection: vi.fn().mockResolvedValue({ id: 's1', course_title: 'Math', section_title: 'P1' }),
      listSectionEnrollments: vi.fn().mockResolvedValue([]),
      updateSection: vi.fn(),
    },
    discussions: {
      listDiscussions: vi.fn().mockResolvedValue([]),
      getDiscussion: vi.fn().mockResolvedValue({}),
      updateDiscussion: vi.fn(),
      deleteDiscussion: vi.fn(),
    },
    groups: { listMyGroups: vi.fn().mockResolvedValue([]), getGroup: vi.fn().mockResolvedValue({}) },
    documents: { listDocuments: vi.fn().mockResolvedValue([]), getDocument: vi.fn().mockResolvedValue({}) },
    authenticate: vi.fn().mockResolvedValue({}),
    logout: vi.fn(),
  } as unknown as SchoologyClient
}

describe('MCP tool registration', () => {
  let server: McpServer
  let client: SchoologyClient

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' })
    client = makeMockClient()
  })

  it('registers all tools without throwing', () => {
    expect(() => registerAllTools(server, client)).not.toThrow()
  })

  it('registers the expected number of tools (13)', () => {
    const registered: string[] = []
    const originalTool = server.tool.bind(server)
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name)
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args)
    }
    registerAllTools(server, client)
    expect(registered).toHaveLength(13)
  })
})
