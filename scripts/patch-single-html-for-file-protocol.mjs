import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

import { ASSET_BASE as CDN } from './shared.mjs'

const FILE_PROTOCOL_GUARD =
  '<script>(function(){if(location.protocol!=="file:")return;var p=history.pushState,r=history.replaceState;history.pushState=function(s,t,u){if(typeof u==="string"&&u.startsWith("/")&&!u.startsWith("//"))return;return p.apply(this,arguments)};history.replaceState=function(s,t,u){if(typeof u==="string"&&u.startsWith("/")&&!u.startsWith("//"))return;return r.apply(this,arguments)}})();</script>'

function findHtmlFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, files)
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(fullPath)
    }
  }
  return files
}

export function patchSingleHtmlForFileProtocol(publicDir) {
  for (const filePath of findHtmlFiles(publicDir)) {
    let html = readFileSync(filePath, 'utf8')

    if (!html.includes('location.protocol!=="file:"')) {
      html = html.replace('<head>', `<head>${FILE_PROTOCOL_GUARD}`, 1)
    }

    html = html
      .replaceAll('href="/favicon.svg"', `href="${CDN}/favicon.svg"`)
      .replaceAll('src="/generator/', `src="${CDN}/`)
      .replaceAll('href="/generator/', `href="${CDN}/`)

    writeFileSync(filePath, html, 'utf8')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const publicDir = process.argv[2]
  if (!publicDir || !statSync(publicDir).isDirectory()) {
    console.error('Usage: node patch-single-html-for-file-protocol.mjs <publicDir>')
    process.exit(1)
  }
  patchSingleHtmlForFileProtocol(publicDir)
  console.log(`Patched HTML files in ${publicDir} for file:// usage`)
}
