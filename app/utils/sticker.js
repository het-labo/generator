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

// Text block, centred in the artboard: 480 wide, 172 tall.
const TEXT = {
  width: 480,
  titleTop: 233,
  titleHeight: 52,
  bodyTop: 309,
  footerX: 35,
  // Frame 1000007544 is 77 tall at y 526 and bottom-aligns its 26-tall line.
  footerTop: 577
}

export { FONT_STACKS }

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

  const title = (content.title || '').trim()
  setFont(ctx, spec.title, spec.color)
  const titleLines = wrapLines(ctx, title, TEXT.width)
  titleLines.forEach((line, i) => {
    const top = TEXT.titleTop + i * spec.title.lineHeight
    ctx.fillText(line, centreX, top + (spec.title.lineHeight - spec.title.size) / 2)
  })

  // The body sits below the title; extra title lines push it down rather than
  // overlapping it.
  const bodyTop = TEXT.bodyTop + Math.max(titleLines.length - 1, 0) * spec.title.lineHeight

  setFont(ctx, spec.body, spec.color)
  wrapLines(ctx, content.body, TEXT.width).forEach((line, i) => {
    const top = bodyTop + i * spec.body.lineHeight
    ctx.fillText(line, centreX, top + (spec.body.lineHeight - spec.body.size) / 2)
  })

  ctx.textAlign = 'left'
  setFont(ctx, spec.footer, spec.color)
  ctx.fillText(
    (content.footer || '').trim(),
    TEXT.footerX,
    TEXT.footerTop + (spec.footer.lineHeight - spec.footer.size) / 2
  )

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export const STICKER_TEXT = TEXT
