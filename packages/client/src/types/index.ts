export interface SchoologyCredentials {
  username: string
  password: string
  domain?: string
  sessionCachePath?: string
  sessionCacheKey?: string
}

export interface SchoologyUser {
  id: string
  uid: string
  school_id: string
  school_uid: string
  name_title: string
  name_first: string
  name_first_preferred: string | null
  name_middle: string | null
  name_last: string
  name_display: string
  username: string
  primary_email: string
  picture_url: string
  gender: string | null
  grad_year: string | null
  position: string | null
  bio: string | null
  type: 'student' | 'teacher' | 'parent' | 'admin'
  language: string
  tz_offset: number
  tz_name: string
  role_id: string
  pending: number
  building_id: string
}

export interface SchoologyCourse {
  id: string
  title: string
  course_code: string
  department: string | null
  description: string | null
  credits: number
  subject_area: number
  grade_level_start: number
  grade_level_end: number
  building_id: string
  school_id: string
  profile_url: string
}

export interface SchoologySection {
  id: string
  course_title: string
  course_code: string
  course_id: string
  school_id: string
  building_id: string
  access_code: string
  section_title: string
  section_code: string
  section_school_code: string
  synced: number
  active: number
  description: string | null
  location: string | null
  meeting_days: string | null
  start_time: string | null
  end_time: string | null
  grading_periods: string[]
  profile_url: string
  group_id: string
  grade_stats: boolean
  options: {
    weighted_grading_categories: number
    sis_id: string | null
  }
}

export interface SchoologyAssignment {
  id: string
  title: string
  description: string | null
  due: string | null
  type: 'assignment' | 'discussion' | 'assessment'
  max_points: number
  factor: number
  is_final: number
  show_comments: number
  grade_stats: number
  allow_dropbox: number
  dropbox_locked: number
  available: string | null
  completion: number
  grading_scale: number | null
  grading_period: string | null
  grading_category: string | null
  section_id: string
  folder_id: string | null
}

export interface SchoologyGrade {
  assignment_id: string
  type: string
  pending: number
  max_points: number
  exceptional: number
  is_final: number
  grade: string | null
  comment: string | null
  enrollment_id: string
}

export interface SchoologyGradePeriod {
  period_id: string
  period_title: string
  period_weight: number
  calculated_grade: string | null
  calculated_grade_string: string | null
  final_grade: string[]
}

export interface SchoologyGradeReport {
  section_id: string
  period: SchoologyGradePeriod[]
  assignment: SchoologyGrade[]
}

export interface SchoologyDiscussion {
  id: string
  title: string
  body: string | null
  published: number
  created: number
  last_updated: number
  available: string | null
  completion: number
  num_comments: number
  display_weight: number
  require_initial_post: number
  attachments: {
    links: { url: string; title: string }[]
    files: { id: string; title: string; url: string }[]
  }
}

export interface SchoologyEvent {
  id: string
  title: string
  description: string | null
  start: string
  has_end: number
  end: string | null
  all_day: number
  type: 'event' | 'assignment'
  rsvp: number
  assignment_id: string | null
  section_id: string | null
  group_id: string | null
  category_id: string | null
}

export interface SchoologyMessage {
  id: string
  author_id: string
  recipient_ids: string
  subject: string
  message: string
  created: number
  last_updated: number
  read: number
  replied: number
  from: {
    uid: string
    name: string
    picture_url: string
  }
}

export interface SchoologyGroup {
  id: string
  title: string
  description: string | null
  website: string | null
  access: number
  group_code: string
  category: string | null
  school_id: string
  building_id: string | null
  member_count: number
  admin: number
  profile_url: string
}

export interface SchoologyDocument {
  id: string
  title: string
  body: string | null
  published: number
  created: number
  last_updated: number
  completion: number
  display_weight: number
  available: string | null
  attachments: {
    links: { url: string; title: string }[]
    files: { id: string; title: string; url: string; converted_url: string }[]
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface SchoologyClientOptions {
  credentials: SchoologyCredentials
  rateLimit?: number
  timeout?: number
  autoReauth?: boolean
}
