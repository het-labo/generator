// Print-ready PDF export for the business cards.
//
// WHY A PDF: the JPG export rasterises everything. The cards set their footer
// at 4.8pt, which lands on roughly 20 pixels at 300 dpi — small enough that
// JPEG's block artefacts chew the letterforms apart. Here the text stays
// vector and the fonts are embedded, so it prints at whatever resolution the
// press runs at.
//
// The layout is the same one canvas draws: coordinates are Figma design units
// (1200 x 776.47 = the trim area), converted once to millimetres.

import { CARD, DESIGN, FONT_STACKS } from './business-card.js'

/** design units -> millimetres */
const mm = (units) => (units * CARD.trimWidth) / DESIGN.width

/** design units -> points, for type sizes */
const pt = (units) => (mm(units) / 25.4) * 72

// PDF fonts are registered by family name and weight; map the CSS stacks the
// card specs use onto them.
const PDF_FAMILY = {
  [FONT_STACKS.workSans]: 'WorkSans',
  [FONT_STACKS.sourceSans]: 'SourceSans3',
  [FONT_STACKS.lato]: 'Lato',
  [FONT_STACKS.baskerville]: 'LibreBaskerville',
  [FONT_STACKS.robotoMono]: 'RobotoMono'
}

// Only the faces the cards actually set text in. Generated from the woff2 by
// scripts/build-pdf-fonts.mjs and served from public/, so they are fetched
// once on demand rather than shipped in the page bundle.
const PDF_FONTS = [
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

const fetchFont = async (assetUrl, file) => {
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

/** Loads an image and returns it as a PNG data URL, which is what jsPDF wants. */
const fetchImage = (assetUrl, path) => {
  if (!imageCache.has(path)) {
    imageCache.set(
      path,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Kon afbeelding niet laden: ${path}`))
        img.src = assetUrl(path)
      })
    )
  }
  return imageCache.get(path)
}

/** Crops an image to a canvas so jsPDF receives exactly the region we want. */
const cropToCanvas = (img, crop) => {
  const sx = crop ? img.width * crop.x : 0
  const sy = crop ? img.height * crop.y : 0
  const sw = crop ? img.width * crop.w : img.width
  const sh = crop ? img.height * crop.h : img.height

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  return { canvas, width: sw, height: sh }
}

const setFont = (doc, style) => {
  doc.setFont(PDF_FAMILY[style.family] || 'WorkSans', 'normal', style.weight || 400)
  doc.setFontSize(pt(style.size))
  doc.setTextColor(style.color)
}

/**
 * Places one line the way the canvas renderer does: by the top of its line
 * box, with the glyphs centred in it.
 */
const text = (doc, str, style, offset) => {
  if (!str) return

  setFont(doc, style)
  const y = offset + mm(style.top + (style.lineHeight - style.size) / 2)
  const options = { baseline: 'top' }
  if (style.align === 'center') options.align = 'center'
  if (style.charSpace) options.charSpace = style.charSpace

  doc.text(str, offset + mm(style.x), y, options)
}

const withOpacity = (doc, opacity, draw) => {
  if (opacity == null || opacity >= 1) return draw()

  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity }))
  draw()
  doc.restoreGraphicsState()
}

const drawImage = (doc, img, { x, y, width, height, opacity, crop }, offset) => {
  const { canvas, width: sw, height: sh } = cropToCanvas(img, crop)
  const w = mm(width)
  const h = mm(height ?? sh * (width / sw))

  withOpacity(doc, opacity, () => doc.addImage(canvas, 'PNG', offset + mm(x), offset + mm(y), w, h))
}

const drawFront = (doc, { card, images, offset }) => {
  const spec = card.front

  const logo = images.get(spec.logo)
  if (logo) {
    const { canvas, width: sw, height: sh } = cropToCanvas(logo, spec.logoCrop)
    const w = mm(spec.logoWidth)
    const h = (sh * (mm(spec.logoWidth) / sw))
    doc.addImage(canvas, 'PNG', offset + mm(spec.logoCx) - w / 2, offset + mm(spec.logoCy) - h / 2, w, h)
  }

  for (const part of spec.lockup || []) {
    // Match the fitted width the canvas renderer produces by spacing letters.
    setFont(doc, part)
    const natural = doc.getTextWidth(part.text)
    const charSpace = (mm(part.targetWidth) - natural) / Math.max(part.text.length - 1, 1)

    text(doc, part.text, { ...part, x: DESIGN.width / 2, align: 'center', charSpace }, offset)
  }

  if (spec.tagline) {
    text(doc, spec.tagline.text, { ...spec.tagline, x: DESIGN.width / 2, align: 'center' }, offset)
  }
}

const drawBack = (doc, { card, company, person, images, offset }) => {
  const spec = card.back

  if (spec.wedge) {
    doc.setFillColor(spec.wedgeColor)
    doc.triangle(
      offset + mm(spec.wedge.x),
      offset,
      offset + mm(DESIGN.width),
      offset,
      offset + mm(DESIGN.width),
      offset + mm(spec.wedge.y),
      'F'
    )
  }

  if (spec.watermark) {
    const mark = images.get(spec.watermark.src)
    if (mark) drawImage(doc, mark, spec.watermark, offset)
  }

  for (const r of spec.outlines || []) {
    doc.setDrawColor(spec.outlineColor)
    doc.setLineWidth(mm(spec.outlineWidth))
    doc.rect(offset + mm(r.x), offset + mm(r.y), mm(r.w), mm(r.h), 'S')
  }

  const { x, color, type } = spec
  const name = (person.name || '').trim() || 'Voornaam Familienaam'

  if (spec.nameLines === 2 && name.includes(' ')) {
    const cut = name.lastIndexOf(' ')
    text(doc, name.slice(0, cut), { ...type.name, x, color, top: spec.y.name }, offset)
    text(doc, name.slice(cut + 1), { ...type.name, x, color, top: spec.y.name + type.name.lineHeight }, offset)
  } else {
    text(doc, name, { ...type.name, x, color, top: spec.y.name }, offset)
  }

  text(doc, (person.job || '').trim(), { ...type.job, x, color, top: spec.y.job }, offset)
  text(doc, (person.phone || '').trim(), { ...type.contact, x, color, top: spec.y.phone }, offset)
  text(doc, (person.email || '').trim(), { ...type.contact, x, color, top: spec.y.email }, offset)
  text(doc, company.websiteUrl.replace(/^https?:\/\//i, ''), { ...type.footer, x, color, top: spec.y.website }, offset)
  text(doc, company.address, { ...type.footer, x, color, top: spec.y.address }, offset)
}

/**
 * Builds a two-page PDF — front, then back — sized to the trim plus bleed.
 *
 * @returns a Blob ready to hand to the printer
 */
export const buildCardPdf = async ({ company, person, assetUrl }) => {
  const { jsPDF } = await import('jspdf')

  const card = company.card
  const pageWidth = CARD.trimWidth + CARD.bleed * 2
  const pageHeight = CARD.trimHeight + CARD.bleed * 2
  const offset = CARD.bleed

  const [fonts, images] = await Promise.all([
    Promise.all(PDF_FONTS.map((f) => fetchFont(assetUrl, f.file).then((data) => ({ ...f, data })))),
    (async () => {
      const paths = [card.front.logo, card.back.logo, card.back.watermark?.src].filter(Boolean)
      const loaded = new Map()
      await Promise.all(
        paths.map((p) =>
          fetchImage(assetUrl, p)
            .then((img) => loaded.set(p, img))
            .catch((err) => console.error(err))
        )
      )
      return loaded
    })()
  ])

  const doc = new jsPDF({
    unit: 'mm',
    format: [pageWidth, pageHeight],
    orientation: 'landscape',
    compress: true
  })

  for (const font of fonts) {
    doc.addFileToVFS(font.file, font.data)
    doc.addFont(font.file, font.family, 'normal', font.weight)
  }

  const sides = [
    { id: 'front', draw: () => drawFront(doc, { card, images, offset }) },
    { id: 'back', draw: () => drawBack(doc, { card, company, person, images, offset }) }
  ]

  sides.forEach((side, index) => {
    if (index > 0) doc.addPage([pageWidth, pageHeight], 'landscape')

    // Background covers the bleed, so the guillotine cannot expose paper.
    doc.setFillColor(card[side.id].bg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    side.draw()
  })

  return doc.output('blob')
}
