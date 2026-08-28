// Converts the woff2 card fonts to TTF for use in the PDF export.
//
// PDF generators cannot read woff2 — they need TTF or OTF. Rather than pull in
// a second copy of these typefaces from another package, this decompresses the
// exact files the app already ships, so screen and print can never drift.
//
//   node scripts/build-pdf-fonts.mjs
//
// Output goes to public/assets/fonts/, deliberately NOT app/assets: files there
// are copied verbatim and fetched on demand, instead of being bundled into
// every page load.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decompress } from 'wawoff2'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'app/assets/fonts')
const target = join(root, 'public/assets/fonts')

// Only the faces the cards actually set text in.
const FACES = [
  'work-sans-400',
  'work-sans-600',
  'source-sans-3-400',
  'lato-400',
  'libre-baskerville-600'
]

mkdirSync(target, { recursive: true })

for (const face of FACES) {
  const woff2 = readFileSync(join(source, `${face}.woff2`))
  const ttf = await decompress(woff2)
  writeFileSync(join(target, `${face}.ttf`), ttf)
  console.log(`${face}.ttf  ${(ttf.length / 1024).toFixed(0)} KB  (uit ${(woff2.length / 1024).toFixed(0)} KB woff2)`)
}

console.log(`\n${FACES.length} fonts geschreven naar public/assets/fonts/`)
