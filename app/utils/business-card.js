// Renders the business cards onto a canvas, print-ready.
//
// COORDINATES: everything below is expressed in the design units of the Figma
// artboard — 1200 × 776.47, which IS the trim area. The canvas is scaled once
// so those numbers can be copied straight out of the spec without conversion
// arithmetic, and the bleed is added around the outside.
//
// PRINT GEOMETRY, fixed by what the printer expects:
//   - trim 85 × 55 mm (European standard; 1200/776.47 is exactly that ratio)
//   - 3 mm bleed on every side, so the background survives the guillotine
//   - 300 dpi
//
// SIDES: 'front' is the logo side, 'back' is the side carrying the person's
// details — matching how the approved Figma files are named.

export const CARD = {
  trimWidth: 85,
  trimHeight: 55,
  bleed: 3,
  dpi: 300
}

/** The Figma artboard. One design unit = 85mm / 1200. */
export const DESIGN = { width: 1200, height: 776.47 }

export const MM_TO_PX = (mm, dpi = CARD.dpi) => Math.round((mm * dpi) / 25.4)

export const cardPixelSize = (dpi = CARD.dpi) => ({
  width: MM_TO_PX(CARD.trimWidth + CARD.bleed * 2, dpi),
  height: MM_TO_PX(CARD.trimHeight + CARD.bleed * 2, dpi)
})

// Fallbacks matter: the standalone single-file build has no network, so the
// webfonts are unavailable there and these stacks decide what prints.
export const FONT_STACKS = {
  workSans: "'Work Sans', system-ui, sans-serif",
  sourceSans: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif",
  lato: "'Lato', system-ui, sans-serif",
  baskerville: "'Libre Baskerville', Baskerville, Georgia, serif",
  robotoMono: "'Roboto Mono', ui-monospace, monospace"
}

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
 * Draws one line of text positioned the way the spec describes it: by the top
 * of its line box, with the glyphs centred in that box (CSS half-leading).
 */
const drawText = (ctx, str, style) => {
  if (!str) return

  ctx.save()
  ctx.fillStyle = style.color
  if (style.opacity != null) ctx.globalAlpha = style.opacity
  ctx.font = `${style.weight || 400} ${style.size}px ${style.family}`
  ctx.textBaseline = 'top'
  ctx.textAlign = style.align || 'left'
  if (style.letterSpacing) ctx.letterSpacing = style.letterSpacing

  ctx.fillText(str, style.x, style.top + (style.lineHeight - style.size) / 2)
  ctx.restore()
}

/**
 * Draws centred text stretched to an exact width by tuning letter-spacing.
 * The Figma spec gives logo lockups as boxes of a known width; matching that
 * width is what keeps the wordmark looking like the logo rather than like
 * ordinary text set in the brand font.
 */
const drawTextFitted = (ctx, str, style) => {
  if (!str) return

  ctx.save()
  ctx.font = `${style.weight || 400} ${style.size}px ${style.family}`
  ctx.letterSpacing = '0px'

  const natural = ctx.measureText(str).width
  const gaps = Math.max(str.length - 1, 1)
  const spacing = (style.targetWidth - natural) / gaps
  ctx.restore()

  drawText(ctx, str, { ...style, letterSpacing: `${spacing}px`, align: 'center', x: style.cx + spacing / 2 })
}

/** Draws an image at an exact box, preserving aspect ratio by fitting width. */
const drawImageAt = (ctx, img, { x, y, width, height, opacity = 1, crop }) => {
  const sx = crop ? img.width * crop.x : 0
  const sy = crop ? img.height * crop.y : 0
  const sw = crop ? img.width * crop.w : img.width
  const sh = crop ? img.height * crop.h : img.height

  const drawWidth = width
  const drawHeight = height ?? sh * (width / sw)

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.drawImage(img, sx, sy, sw, sh, x, y, drawWidth, drawHeight)
  ctx.restore()
}

/** Centres an image of a given width on a point, keeping its aspect ratio. */
const drawImageCentred = (ctx, img, { cx, cy, width, crop }) => {
  const sw = crop ? img.width * crop.w : img.width
  const sh = crop ? img.height * crop.h : img.height
  const height = sh * (width / sw)
  drawImageAt(ctx, img, { x: cx - width / 2, y: cy - height / 2, width, height, crop })
}

const drawBack = (ctx, { card, company, person, images }) => {
  const spec = card.back

  // HVM's card is white with a cream wedge left showing in the top-right
  // corner, rather than a flat background.
  if (spec.wedge) {
    ctx.fillStyle = spec.wedgeColor
    ctx.beginPath()
    ctx.moveTo(spec.wedge.x, 0)
    ctx.lineTo(DESIGN.width, 0)
    ctx.lineTo(DESIGN.width, spec.wedge.y)
    ctx.closePath()
    ctx.fill()
  }

  // Faint mark behind the text.
  if (spec.watermark) {
    const mark = images.get(spec.watermark.src)
    if (mark) drawImageAt(ctx, mark, spec.watermark)
  }

  // Casa Futura's monogram is three outlined rectangles, per the spec.
  for (const r of spec.outlines || []) {
    ctx.save()
    ctx.strokeStyle = spec.outlineColor
    ctx.lineWidth = spec.outlineWidth
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    ctx.restore()
  }

  const { x, color, type } = spec
  const name = (person.name || '').trim() || 'Voornaam Familienaam'

  if (spec.nameLines === 2 && name.includes(' ')) {
    const cut = name.lastIndexOf(' ')
    drawText(ctx, name.slice(0, cut), { ...type.name, x, color, top: spec.y.name })
    drawText(ctx, name.slice(cut + 1), { ...type.name, x, color, top: spec.y.name + type.name.lineHeight })
  } else {
    drawText(ctx, name, { ...type.name, x, color, top: spec.y.name })
  }

  drawText(ctx, (person.job || '').trim(), { ...type.job, x, color, top: spec.y.job })
  drawText(ctx, (person.phone || '').trim(), { ...type.contact, x, color, top: spec.y.phone })
  drawText(ctx, (person.email || '').trim(), { ...type.contact, x, color, top: spec.y.email })

  drawText(ctx, company.websiteUrl.replace(/^https?:\/\//i, ''), {
    ...type.footer,
    x,
    color,
    top: spec.y.website
  })
  drawText(ctx, company.address, { ...type.footer, x, color, top: spec.y.address })
}

const drawFront = (ctx, { card, images }) => {
  const spec = card.front

  const logo = images.get(spec.logo)
  if (logo) drawImageCentred(ctx, logo, { cx: spec.logoCx, cy: spec.logoCy, width: spec.logoWidth, crop: spec.logoCrop })

  // Some lockups are only available as a mark; the wordmark under it is set
  // from the brand font to the width the spec gives.
  for (const part of spec.lockup || []) {
    drawTextFitted(ctx, part.text, { ...part, cx: DESIGN.width / 2 })
  }

  if (spec.tagline) {
    drawText(ctx, spec.tagline.text, { ...spec.tagline, align: 'center', x: DESIGN.width / 2 })
  }
}

/**
 * Renders one side of a company's business card.
 *
 * @param canvas   target <canvas>; resized to the full bleed size
 * @param side     'front' (logo) | 'back' (personal details)
 * @param company  a record from COMPANIES
 * @param person   { name, job, phone, email }
 * @param assetUrl resolves a public/ path to something the canvas may load
 * @param dpi      export resolution; the on-screen preview uses a lower one
 */
export const renderCard = async (canvas, { side, company, person, assetUrl, dpi = CARD.dpi }) => {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  const card = company.card
  const spec = card[side]

  // Load every asset up front. Drawing then happens in one synchronous pass,
  // so two overlapping renders cannot interleave — which used to stack the
  // watermark's alpha on top of itself.
  const sources = [spec.logo, spec.watermark?.src].filter(Boolean)
  const images = new Map()
  await Promise.all(
    sources.map((src) =>
      loadImage(assetUrl(src))
        .then((img) => images.set(src, img))
        .catch((err) => console.error(err))
    )
  )

  const { width, height } = cardPixelSize(dpi)
  canvas.width = width
  canvas.height = height

  // Background covers the bleed as well, so the guillotine cannot expose paper.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = spec.bg
  ctx.fillRect(0, 0, width, height)

  // From here on, draw in Figma design units.
  const scale = MM_TO_PX(CARD.trimWidth, dpi) / DESIGN.width
  const bleedPx = MM_TO_PX(CARD.bleed, dpi)
  ctx.setTransform(scale, 0, 0, scale, bleedPx, bleedPx)

  if (side === 'back') drawBack(ctx, { card, company, person, images })
  else drawFront(ctx, { card, images })

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/** Exports a rendered canvas as a JPEG blob. Print wants no alpha channel. */
export const canvasToJpeg = (canvas, quality = 0.95) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
