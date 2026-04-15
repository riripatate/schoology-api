import { describe, it, expect, beforeEach } from 'vitest'
import { SchoologyHttpClient } from '../../src/http/client.js'
import { CoursesEndpoint } from '../../src/endpoints/courses.js'
import { SectionsEndpoint } from '../../src/endpoints/sections.js'
import { mockDomain, server } from '../setup.js'
import { http, HttpResponse } from 'msw'

const mockSession = {
  cookies: [{ name: 'PHPSESSID', value: 'test', domain: mockDomain, path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'None' as const }],
  capturedAt: Date.now(),
  domain: mockDomain,
}

describe('CoursesEndpoint', () => {
  let endpoint: CoursesEndpoint

  beforeEach(() => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/courses/c1`, () =>
        HttpResponse.json({ id: 'c1', title: 'Math 101', course_code: 'MATH101', department: null, description: null, credits: 1, subject_area: 1, grade_level_start: 9, grade_level_end: 12, building_id: 'b1', school_id: 'sc1', profile_url: '' })
      )
    )
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new CoursesEndpoint(client)
  })

  it('getCourse returns course details', async () => {
    const course = await endpoint.getCourse('c1')
    expect(course.title).toBe('Math 101')
    expect(course.course_code).toBe('MATH101')
  })
})

describe('SectionsEndpoint', () => {
  let endpoint: SectionsEndpoint

  beforeEach(() => {
    server.use(
      http.get(`https://${mockDomain}/api/v1/sections/s1`, () =>
        HttpResponse.json({ id: 's1', course_title: 'Math 101', course_code: 'MATH101', section_title: 'Period 1', course_id: 'c1', school_id: 'sc1', building_id: 'b1', access_code: 'abc', section_code: 'P1', section_school_code: '', synced: 0, active: 1, description: null, location: null, meeting_days: null, start_time: null, end_time: null, grading_periods: [], profile_url: '', group_id: 'g1', grade_stats: false, options: { weighted_grading_categories: 0, sis_id: null } })
      )
    )
    const client = new SchoologyHttpClient(mockDomain)
    client.setSession(mockSession)
    endpoint = new SectionsEndpoint(client)
  })

  it('getSection returns section details', async () => {
    const section = await endpoint.getSection('s1')
    expect(section.course_title).toBe('Math 101')
  })
})
