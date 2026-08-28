import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { patchSingleHtmlForFileProtocol } from './patch-single-html-for-file-protocol.mjs'

const companies = [
    { id: 'md', file: 'md-bouw.html' },
    { id: 'cf', file: 'casa-futura.html' },
    { id: 'gv', file: 'gevanco.html' },
    { id: 'hvm', file: 'hvm.html' }
]

const rootDir = process.cwd()
const publicDir = join(rootDir, '.output/public')

// Important: keep this OUTSIDE .output,
// because Nuxt can delete/recreate .output during generate.
const outputDir = join(rootDir, 'company-html')

function findHtmlFiles(dir, files = []) {
    if (!existsSync(dir)) return files

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
            findHtmlFiles(fullPath, files)
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath)
        }
    }

    return files
}

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

for (const company of companies) {
    console.log(`\nGenerating ${company.file}...`)

    const result = spawnSync(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['nuxt', 'generate'],
        {
            stdio: 'inherit',
            env: {
                ...process.env,
                NUXT_SINGLE_FILE: 'true',
                NUXT_COMPANY: company.id
            }
        }
    )

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }

    patchSingleHtmlForFileProtocol(publicDir)

    const htmlFiles = findHtmlFiles(publicDir)

    if (!htmlFiles.length) {
        throw new Error(`No HTML file found in ${publicDir}`)
    }

    const generatedFile =
        htmlFiles.find(file => file.endsWith('/index.html')) ||
        htmlFiles[0]

    const targetFile = join(outputDir, company.file)

    copyFileSync(generatedFile, targetFile)

    console.log(`Created ${targetFile}`)
}

console.log('\nDone. Company HTML files are in:')
console.log(outputDir)