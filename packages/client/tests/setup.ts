import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const mockDomain = 'test.schoology.com'
export const mockBaseUrl = `https://${mockDomain}`

export const handlers = [
  http.get(`${mockBaseUrl}/api/v1/users/me`, () =>
    HttpResponse.json({
      id: '1234567',
      uid: '1234567',
      school_id: 's1',
      school_uid: 's1',
      name_title: '',
      name_first: 'Test',
      name_first_preferred: null,
      name_middle: null,
      name_last: 'Student',
      name_display: 'Test Student',
      username: 'test.student',
      primary_email: 'test@school.edu',
      picture_url: '',
      gender: null,
      grad_year: null,
      position: null,
      bio: null,
      type: 'student',
      language: 'en',
      tz_offset: 0,
      tz_name: 'UTC',
      role_id: 'r1',
      pending: 0,
      building_id: 'b1',
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/users/me/sections`, () =>
    HttpResponse.json({
      section: [
        { id: 's1', course_title: 'Math 101', course_code: 'MATH101', section_title: 'Period 1', course_id: 'c1', school_id: 'sc1', building_id: 'b1', access_code: 'abc', section_code: 'P1', section_school_code: '', synced: 0, active: 1, description: null, location: null, meeting_days: null, start_time: null, end_time: null, grading_periods: [], profile_url: '', group_id: 'g1', grade_stats: false, options: { weighted_grading_categories: 0, sis_id: null } },
        { id: 's2', course_title: 'English 101', course_code: 'ENG101', section_title: 'Period 2', course_id: 'c2', school_id: 'sc1', building_id: 'b1', access_code: 'def', section_code: 'P2', section_school_code: '', synced: 0, active: 1, description: null, location: null, meeting_days: null, start_time: null, end_time: null, grading_periods: [], profile_url: '', group_id: 'g2', grade_stats: false, options: { weighted_grading_categories: 0, sis_id: null } },
      ],
      total: 2,
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/sections/s1/assignments`, () =>
    HttpResponse.json({
      assignment: [
        { id: 'a1', title: 'Homework 1', description: null, due: '2026-04-20 23:59:00', type: 'assignment', max_points: 100, factor: 1, is_final: 0, show_comments: 1, grade_stats: 0, allow_dropbox: 1, dropbox_locked: 0, available: null, completion: 0, grading_scale: null, grading_period: null, grading_category: null, section_id: 's1', folder_id: null },
      ],
      total: 1,
    })
  ),
  http.get(`${mockBaseUrl}/api/v1/users/me/grades`, () =>
    HttpResponse.json({
      section: [
        {
          section_id: 's1',
          period: [{ period_id: 'p1', period_title: 'Q4', period_weight: 1, calculated_grade: '95', calculated_grade_string: 'A', final_grade: [] }],
          assignment: [{ assignment_id: 'a1', type: 'assignment', pending: 0, max_points: 100, exceptional: 0, is_final: 0, grade: '92', comment: null, enrollment_id: 'e1' }],
        },
      ],
    })
  ),
]

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
