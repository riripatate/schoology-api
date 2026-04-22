// Example: Use @schoologymcp/client in a Next.js API route
// .env.local:
//   SCHOOLOGY_USERNAME=youruser
//   SCHOOLOGY_PASSWORD=yourpassword
//   SCHOOLOGY_DOMAIN=yourschool.schoology.com

import { SchoologyClient } from '@schoologymcp/client'

const client = new SchoologyClient({
  credentials: {
    username: process.env.SCHOOLOGY_USERNAME!,
    password: process.env.SCHOOLOGY_PASSWORD!,
    domain: process.env.SCHOOLOGY_DOMAIN!,
  },
})

// Next.js App Router: GET /api/grades
export async function GET() {
  await client.authenticate()
  const grades = await client.grades.getMyGrades()
  return Response.json({ grades })
}
