// Shared plumbing for the PDF exports: font loading, image conversion and the
// mapping from the CSS font stacks onto the faces registered in the document.

import { FONT_STACKS } from './business-card.js'

// PDF fonts are registered by family name and weight; map the CSS stacks the
// specs use onto them.
export const PDF_FAMILY = {
  [FONT_STACKS.workSans]: 'WorkSans',
  [FONT_STACKS.sourceSans]: 'SourceSans3',
  [FONT_STACKS.lato]: 'Lato',
  [FONT_STACKS.baskerville]: 'LibreBaskerville',
  [FONT_STACKS.robotoMono]: 'RobotoMono'
}

// Generated from the woff2 by scripts/build-pdf-fonts.mjs and served from
// public/, so they are fetched on demand rather than bundled into every page.
export const PDF_FONTS = [
  { file: 'work-sans-400.ttf', family: 'WorkSans', weight: 400 },
  { file: 'work-sans-600.ttf', family: 'WorkSans', weight: 600 },
  { file: 'source-sans-3-400.ttf', family: 'SourceSans3', weight: 400 },
  { file: 'lato-400.ttf', family: 'Lato', weight: 400 },
  { file: 'libre-baskerville-600.ttf', family: 'LibreBaskerville', weight: 600 }
]

const toBase64 = (buffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000

  // Chunked, because spreading a 60KB array into String.fromCharCode blows the
  // argument limit in some browsers.
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const fontCache = new Map()

export const fetchPdfFont = (assetUrl, file) => {
  if (!fontCache.has(file)) {
    fontCache.set(
      file,
      fetch(assetUrl(`assets/fonts/${file}`))
        .then((r) => {
          if (!r.ok) throw new Error(`${file}: ${r.status}`)
          return r.arrayBuffer()
        })
        .then(toBase64)
    )
  }
  return fontCache.get(file)
}

const imageCache = new Map()

export const loadPdfImage = (assetUrl, path) => {
  if (!imageCache.has(path)) {
    imageCache.set(
      path,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => {
          imageCache.delete(path)
          reject(new Error(`Kon afbeelding niet laden: ${path}`))
        }
        img.src = assetUrl(path)
      })
    )
  }
  return imageCache.get(path)
}

/**
 * Rasterises an image (optionally a crop of it) onto a canvas, which is what
 * jsPDF accepts. SVG sources carry their own intrinsic size, so they land here
 * at whatever resolution the file declares.
 */
export const imageToCanvas = (img, crop) => {
  const sx = crop ? img.width * crop.x : 0
  const sy = crop ? img.height * crop.y : 0
  const sw = crop ? img.width * crop.w : img.width
  const sh = crop ? img.height * crop.h : img.height

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas
}
