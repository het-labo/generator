// Builds and uploads one company's standalone generator to its own domain.
//
//   node scripts/deploy-company.mjs md
//
// Credentials come from .env.<id> (for example .env.md), so each company's
// hosting is configured once and the command stays the same. That file needs:
//
//   FTP_HOST=ftp.mdbouw.be
//   FTP_USER=...
//   FTP_PASSWORD=...
//   FTP_REMOTE_ROOT=/public_html/tools/e-mail-handtekening/
//   BASE_PATH=/tools/e-mail-handtekening/
//
// BASE_PATH is the path the tool is served from. It has to be known at build
// time because the asset paths are baked in, and it must match the tail of
// FTP_REMOTE_ROOT — deploy.cjs refuses the upload when they disagree.
//
// Doing this by hand means exporting four variables per company and hoping the
// last build in .output belongs to the one you are uploading — which is
// exactly the mistake deploy.cjs now refuses to make.

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COMPANIES } from '../app/utils/companies.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const id = process.argv[2]

const bail = (message, detail) => {
  console.error(`\n✗ ${message}`)
  if (detail) console.error(detail)
  process.exit(1)
}

if (!id || !COMPANIES[id]) {
  bail(
    `Geef een bedrijf op: ${Object.keys(COMPANIES).join(', ')}`,
    'Bijvoorbeeld: node scripts/deploy-company.mjs md'
  )
}

const envFile = join(root, `.env.${id}`)
if (!existsSync(envFile)) {
  bail(
    `${`.env.${id}`} ontbreekt.`,
    'Zet daar FTP_HOST, FTP_USER, FTP_PASSWORD en FTP_REMOTE_ROOT van dit bedrijf in.'
  )
}

// Read BASE_PATH here so the build gets it; deploy.cjs reads the rest itself.
const basePath = (readFileSync(envFile, 'utf8').match(/^\s*BASE_PATH\s*=\s*(.+)$/m)?.[1] || '').trim()

if (basePath && !(basePath.startsWith('/') && basePath.endsWith('/'))) {
  bail('BASE_PATH moet met een slash beginnen en eindigen.', `Nu: ${basePath}`)
}

const company = COMPANIES[id]
console.log(`\n▸ ${company.name} — bouwen${basePath ? ` voor ${basePath}` : ''}…`)

const run = (command, args, env) =>
  spawnSync(command, args, { stdio: 'inherit', cwd: root, env: { ...process.env, ...env } })

const build = run('npx', ['nuxt', 'generate'], { NUXT_COMPANY: id, NUXT_BASE_PATH: basePath })
if (build.status !== 0) bail('De build is mislukt.')

console.log(`\n▸ ${company.name} — uploaden…`)

// deploy.cjs reads its own .env; point dotenv at this company's file instead.
const deploy = run('node', ['deploy.cjs'], { DOTENV_CONFIG_PATH: envFile })
if (deploy.status !== 0) bail('De upload is mislukt.')

console.log(`\n✓ ${company.name} staat online.`)
