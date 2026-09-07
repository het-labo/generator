// Renders the stickers onto a canvas.
//
// COORDINATES: design units of the Figma artboard — 1016 x 638 — the same
// convention the business cards use, so numbers can be copied straight from
// the spec.
//
// PHYSICAL SIZE: the Figma file gives no millimetres, so this assumes the
// artboard is drawn at 10 units per millimetre, making the sticker
// 101.6 x 63.8 mm. That reading fits the round numbers everywhere else in the
// spec (35 units margin = 3.5 mm, 220 units logo = 22 mm). If the print run
// is meant to be another size, STICKER.widthMm/heightMm below is the only
// thing to change — the layout scales with it.

import { FONT_STACKS } from './business-card.js'

export const STICKER = {
  widthMm: 101.6,
  heightMm: 63.8,
  bleed: 3,
  dpi: 300
}

export const STICKER_DESIGN = { width: 1016, height: 638 }

// The title/body block is centred in the artboard rather than pinned to a
// fixed y. With the spec's own content that reproduces the approved layout
// exactly (52 + 24 gap + 96 = 172 tall, centred on 319, so top 233), and it
// keeps the block centred when the body is empty or the title wraps.
const TEXT = {
  width: 480,
  centreY: 319,
  gap: 24,
  footerX: 35,
  // Frame 1000007544 is 77 tall at y 526 and bottom-aligns its 26-tall line.
  footerTop: 577
}

/**
 * Lays out the centred text block: which lines go where, given the content
 * that is actually there. Shared with the PDF so both place it identically.
 */
export const layoutStickerText = (measure, type, content) => {
  measure.font = `${type.title.weight || 400} ${type.title.size}px ${type.title.family}`
  measure.letterSpacing = type.title.letterSpacing ? `${type.title.letterSpacing * type.title.size}px` : '0px'
  const titleLines = (content.title || '').trim() ? wrapLines(measure, content.title.trim(), TEXT.width) : []

  measure.font = `${type.body.weight || 400} ${type.body.size}px ${type.body.family}`
  measure.letterSpacing = '0px'
  const bodyLines = (content.body || '').trim() ? wrapLines(measure, content.body.trim(), TEXT.width) : []

  const titleHeight = titleLines.length * type.title.lineHeight
  const bodyHeight = bodyLines.length * type.body.lineHeight
  const gap = titleLines.length && bodyLines.length ? TEXT.gap : 0
  const top = TEXT.centreY - (titleHeight + gap + bodyHeight) / 2

  return {
    title: titleLines.map((text, i) => ({ text, top: top + i * type.title.lineHeight })),
    body: bodyLines.map((text, i) => ({ text, top: top + titleHeight + gap + i * type.body.lineHeight }))
  }
}

/**
 * Applies the user's chosen sizes on top of a company's type spec.
 *
 * Line height scales with the size rather than staying fixed, otherwise
 * enlarging the body text makes its lines overlap. The ratio comes from the
 * spec, so the default sizes reproduce the approved design exactly.
 */
export const resolveStickerType = (spec, content = {}) => {
  const scaled = (style, size) =>
    size && size !== style.size
      ? { ...style, size, lineHeight: Math.round(size * (style.lineHeight / style.size) * 100) / 100 }
      : style

  return {
    title: scaled(spec.title, content.titleSize),
    body: scaled(spec.body, content.bodySize),
    footer: scaled(spec.footer, content.footerSize)
  }
}

export const stickerPixelSize = (dpi = STICKER.dpi) => ({
  width: Math.round(((STICKER.widthMm + STICKER.bleed * 2) * dpi) / 25.4),
  height: Math.round(((STICKER.heightMm + STICKER.bleed * 2) * dpi) / 25.4)
})

const imageCache = new Map()

const loadImage = (src) => {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => {
          imageCache.delete(src)
          reject(new Error(`Kon afbeelding niet laden: ${src}`))
        }
        img.src = src
      })
    )
  }
  return imageCache.get(src)
}

/**
 * Fits an image inside a box without distorting it, centred — the logo boxes
 * in the spec are bounding boxes, not exact image dimensions.
 */
const drawContain = (ctx, img, box) => {
  const scale = Math.min(box.width / img.width, box.height / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, box.x + (box.width - w) / 2, box.y + (box.height - h) / 2, w, h)
}

/** Wraps text to a maximum width and returns the lines. */
export const wrapLines = (ctx, text, maxWidth) => {
  const lines = []

  for (const paragraph of String(text || '').split('\n')) {
    let line = ''

    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    lines.push(line)
  }
  return lines
}

const setFont = (ctx, style, color) => {
  ctx.fillStyle = color
  ctx.font = `${style.weight || 400} ${style.size}px ${style.family}`
  ctx.letterSpacing = style.letterSpacing ? `${style.letterSpacing * style.size}px` : '0px'
}

/**
 * Renders a sticker.
 *
 * @param canvas   target <canvas>; resized to the full bleed size
 * @param company  a record from COMPANIES
 * @param content  { title, body, footer } — all editable by the user
 * @param assetUrl resolves a public/ path
 * @param dpi      export resolution; the preview uses a lower one
 */
export const renderSticker = async (canvas, { company, content, assetUrl, dpi = STICKER.dpi }) => {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  const spec = company.sticker
  const type = resolveStickerType(spec, content)

  const images = new Map()
  await Promise.all(
    [spec.logo, spec.monogram].filter(Boolean).map((src) =>
      loadImage(assetUrl(src))
        .then((img) => images.set(src, img))
        .catch((err) => console.error(err))
    )
  )

  const { width, height } = stickerPixelSize(dpi)
  canvas.width = width
  canvas.height = height

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = spec.bg
  ctx.fillRect(0, 0, width, height)

  // Draw in design units from here on.
  const trimPx = (STICKER.widthMm * dpi) / 25.4
  const scale = trimPx / STICKER_DESIGN.width
  const bleedPx = (STICKER.bleed * dpi) / 25.4
  ctx.setTransform(scale, 0, 0, scale, bleedPx, bleedPx)

  const logo = images.get(spec.logo)
  if (logo) drawContain(ctx, logo, spec.logoBox)

  const monogram = images.get(spec.monogram)
  if (monogram) drawContain(ctx, monogram, spec.monogramBox)

  const centreX = STICKER_DESIGN.width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const block = layoutStickerText(ctx, type, content)

  setFont(ctx, type.title, spec.color)
  for (const line of block.title) {
    ctx.fillText(line.text, centreX, line.top + (type.title.lineHeight - type.title.size) / 2)
  }

  setFont(ctx, type.body, spec.color)
  for (const line of block.body) {
    ctx.fillText(line.text, centreX, line.top + (type.body.lineHeight - type.body.size) / 2)
  }

  ctx.textAlign = 'left'
  setFont(ctx, type.footer, spec.color)
  ctx.fillText(
    (content.footer || '').trim(),
    TEXT.footerX,
    TEXT.footerTop + (type.footer.lineHeight - type.footer.size) / 2
  )

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export const STICKER_TEXT = TEXT
