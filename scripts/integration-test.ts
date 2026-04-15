#!/usr/bin/env npx tsx
/**
 * Integration test — runs against a real Schoology instance.
 * Requires: SCHOOLOGY_USERNAME, SCHOOLOGY_PASSWORD, SCHOOLOGY_DOMAIN in env.
 *
 * Run: pnpm exec dotenv-cli -e .env.local -- pnpm exec tsx scripts/integration-test.ts
 */
import { SchoologyClient } from '../packages/client/src/index.js'

const required = ['SCHOOLOGY_USERNAME', 'SCHOOLOGY_PASSWORD', 'SCHOOLOGY_DOMAIN'] as const
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
}

const client = new SchoologyClient({
  credentials: {
    username: process.env['SCHOOLOGY_USERNAME']!,
    password: process.env['SCHOOLOGY_PASSWORD']!,
    domain: process.env['SCHOOLOGY_DOMAIN']!,
  },
})

type CheckResult = 'pass' | 'empty' | 'fail'

async function check(name: string, fn: () => Promise<unknown>): Promise<CheckResult> {
  process.stdout.write(`  ${name}... `)
  try {
    const result = await fn()
    if (result === null || result === undefined) {
      console.log('❌ (null/undefined)')
      return 'fail'
    }
    if (Array.isArray(result) && result.length === 0) {
      console.log('⚠️  (empty — may be correct)')
      return 'empty'
    }
    console.log('✅')
    return 'pass'
  } catch (err) {
    console.log(`❌ ${(err as Error).message}`)
    return 'fail'
  }
}

async function run() {
  console.log('\n🔐 Authenticating...')
  await client.authenticate()
  console.log('✅ Login successful\n')

  const results: CheckResult[] = []

  console.log('👤 User')
  results.push(await check('getMe()', () => client.users.getMe()))
  const sections = await client.users.getMySections()
  results.push(sections.length > 0 ? 'pass' : 'empty')
  console.log(`  getMySections()... ${sections.length > 0 ? `✅ (${sections.length} sections)` : '⚠️  (empty)'}`)

  if (sections.length > 0) {
    const sectionId = sections[0]!.id
    console.log(`\n📚 Section: ${sections[0]!.course_title} (${sectionId})`)
    results.push(await check(`listAssignments(${sectionId})`, () => client.assignments.listAssignments(sectionId)))
    results.push(await check(`listDiscussions(${sectionId})`, () => client.discussions.listDiscussions(sectionId)))
    results.push(await check(`listDocuments(${sectionId})`, () => client.documents.listDocuments(sectionId)))
    results.push(await check(`getSectionGrades(${sectionId})`, () => client.grades.getSectionGrades(sectionId)))
  }

  console.log('\n📊 Grades')
  results.push(await check('getMyGrades()', () => client.grades.getMyGrades()))

  console.log('\n📅 Events')
  results.push(await check('listMyEvents()', () => client.events.listMyEvents()))

  console.log('\n✉️  Messages')
  results.push(await check('listInbox()', () => client.messages.listInbox()))
  results.push(await check('listSent()', () => client.messages.listSent()))

  console.log('\n👥 Groups')
  results.push(await check('listMyGroups()', () => client.groups.listMyGroups()))

  const failures = results.filter((r) => r === 'fail').length
  const passes = results.filter((r) => r === 'pass').length
  const empties = results.filter((r) => r === 'empty').length

  console.log(`\n📋 Results: ${passes} passed, ${empties} empty, ${failures} failed`)

  if (failures > 0) {
    console.log('⚠️  Some checks failed — review API responses above')
    process.exit(1)
  } else {
    console.log('✨ All integration checks passed!')
  }
}

run().catch((err) => {
  console.error('\n💥 Fatal:', err)
  process.exit(1)
})
