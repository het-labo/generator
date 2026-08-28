// Regression check for the generated e-mail signatures.
//
// The signature markup is shaped around a long list of Outlook/Word quirks
// (see the comments in app/utils/signature.js). Those are easy to break by
// accident and impossible to notice in a browser, which renders the broken
// version just fine. This script pins the exact output per company.
//
//   node scripts/check-signatures.mjs            compare against the fixtures
//   node scripts/check-signatures.mjs --update   accept the current output
//
// Run it after touching signature.js or any company record, and eyeball a
// real paste into Outlook whenever a diff is intentional.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COMPANY_LIST } from '../app/utils/companies.js'
import { buildSignatureHtml, companyFormDefaults } from '../app/utils/signature.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(here, '__fixtures__')

// A filled-in person, so optional branches (photo, job, phone, e-mail rows)
// are covered rather than skipped.
const SAMPLE_PERSON = {
  name: 'Jan Peeters',
  job: 'Projectleider',
  email: 'jan@example.be',
  phone: '0470 12 34 56'
}

const render = (company) =>
  buildSignatureHtml({
    company,
    form: { ...SAMPLE_PERSON, ...companyFormDefaults(company) },
    photo: 'https://example.invalid/photo.png'
  })

const update = process.argv.includes('--update')
mkdirSync(fixtureDir, { recursive: true })

if (update) {
  for (const company of COMPANY_LIST) {
    writeFileSync(join(fixtureDir, `${company.slug}.html`), render(company), 'utf8')
  }
  console.log(`Updated ${COMPANY_LIST.length} fixtures in scripts/__fixtures__/`)
  process.exit(0)
}

if (!readdirSync(fixtureDir).length) {
  console.error('No fixtures yet. Run: node scripts/check-signatures.mjs --update')
  process.exit(1)
}

let failed = 0

for (const company of COMPANY_LIST) {
  const fixture = join(fixtureDir, `${company.slug}.html`)
  const actual = render(company)

  let expected
  try {
    expected = readFileSync(fixture, 'utf8')
  } catch {
    console.error(`✗ ${company.slug}: no fixture — run with --update`)
    failed++
    continue
  }

  if (actual === expected) {
    console.log(`✓ ${company.slug}`)
    continue
  }

  failed++
  console.error(`✗ ${company.slug}: output changed (${expected.length} → ${actual.length} chars)`)

  // Point at the first difference rather than dumping two 4KB strings.
  const at = [...actual].findIndex((ch, i) => ch !== expected[i])
  const from = Math.max(0, at - 60)
  console.error(`  at char ${at}`)
  console.error(`  expected: …${expected.slice(from, at + 60)}…`)
  console.error(`  actual:   …${actual.slice(from, at + 60)}…`)
}

if (failed) {
  console.error(`\n${failed} of ${COMPANY_LIST.length} signatures changed.`)
  console.error('Intentional? Verify a paste into Outlook, then run with --update.')
  process.exit(1)
}

console.log(`\nAll ${COMPANY_LIST.length} signatures match.`)
