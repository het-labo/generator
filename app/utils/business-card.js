// Renders the business cards onto a canvas, print-ready.
//
// Print geometry, all of it fixed by what a printer expects:
//   - trim size 85 × 55 mm (European standard, and the ratio of the approved
//     reference cards)
//   - 3 mm bleed on every side, so the background survives the guillotine
//   - 300 dpi, because anything less prints visibly soft
//
// Everything below is positioned in millimetres relative to the TRIM edge and
// converted once, so the layout stays the same if the dpi ever changes.

export const CARD = {
  trimWidth: 85,
  trimHeight: 55,
  bleed: 3,
  // Distance text must keep from the trim edge; printers cut with tolerance.
  safeMargin: 6,
  dpi: 300
}

export const MM_TO_PX = (mm, dpi = CARD.dpi) => Math.round((mm * dpi) / 25.4)

export const cardPixelSize = (dpi = CARD.dpi) => ({
  width: MM_TO_PX(CARD.trimWidth + CARD.bleed * 2, dpi),
  height: MM_TO_PX(CARD.trimHeight + CARD.bleed * 2, dpi)
})

const FONTS = {
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif"
}

// Type scale in millimetres, measured off the reference cards.
const TYPE = {
  name: { size: 5.4, weight: 700, y: 9.6 },
  nameLine2: { y: 15.2 },
  job: { size: 2.9, weight: 400, y: 13.4 },
  jobTwoLine: { y: 19.0 },
  contact: { size: 3.4, weight: 400, y: 20.6, lineHeight: 4.4 },
  contactTwoLine: { y: 26.2 },
  footer: { size: 2.9, weight: 400, y: 46.6, lineHeight: 4.0 },
  tagline: { size: 3.0, weight: 400, y: 48.0 }
}

// Cached, because every keystroke re-renders both sides and re-decoding the
// logos each time is what made rendering slow enough to interleave.
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
 * Draws an image scaled to a fraction of the card width, centred on a point
 * given as a fraction of the full (bleed-inclusive) canvas.
 */
const drawContained = (ctx, img, { canvasWidth, canvasHeight, widthFraction, x, y, opacity = 1, crop }) => {
  // crop selects a region of the source image, in fractions — the logo files
  // bundle a mark and a wordmark, and the cards only want the mark.
  const sx = crop ? img.width * crop.x : 0
  const sy = crop ? img.height * crop.y : 0
  const sw = crop ? img.width * crop.w : img.width
  const sh = crop ? img.height * crop.h : img.height

  const targetWidth = canvasWidth * widthFraction
  const targetHeight = sh * (targetWidth / sw)

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.drawImage(
    img,
    sx, sy, sw, sh,
    canvasWidth * x - targetWidth / 2,
    canvasHeight * y - targetHeight / 2,
    targetWidth,
    targetHeight
  )
  ctx.restore()
}

/**
 * Renders one side of a company's business card.
 *
 * @param canvas   target <canvas>; resized to the full bleed size
 * @param side     'front' | 'back'
 * @param company  a record from COMPANIES
 * @param person   { name, job, phone, email }
 * @param assetUrl resolves a public/ path to something the canvas may load
 * @param dpi      export resolution; the on-screen preview uses a lower one
 */
export const renderCard = async (canvas, { side, company, person, assetUrl, dpi = CARD.dpi }) => {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  const cfgEarly = company.card

  // Load every asset this side needs BEFORE touching the canvas. Drawing then
  // happens in one synchronous pass, so two overlapping renders can never
  // interleave — which previously stacked the watermark's alpha on itself.
  const needed = side === 'back' ? [cfgEarly.backLogo] : cfgEarly.watermark ? [cfgEarly.watermark.src] : []
  const loaded = new Map()
  await Promise.all(
    needed.map((src) =>
      loadImage(assetUrl(src))
        .then((img) => loaded.set(src, img))
        .catch((err) => console.error(err))
    )
  )

  const { width, height } = cardPixelSize(dpi)
  canvas.width = width
  canvas.height = height

  const px = (mm) => MM_TO_PX(mm, dpi)
  const bleed = px(CARD.bleed)
  // Text coordinates are trim-relative, so shift them into the bleed canvas.
  const left = bleed + px(CARD.safeMargin)
  const atY = (mm) => bleed + px(mm)

  const cfg = company.card

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = side === 'back' ? cfg.backBg : cfg.frontBg
  ctx.fillRect(0, 0, width, height)

  if (side === 'back') {
    const logo = loaded.get(cfg.backLogo)
    if (logo) drawContained(ctx, logo, {
      canvasWidth: width,
      canvasHeight: height,
      widthFraction: cfg.backLogoScale,
      x: 0.5,
      y: cfg.tagline ? 0.46 : 0.5
    })

    if (cfg.tagline) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = `${TYPE.tagline.weight} ${px(TYPE.tagline.size)}px ${FONTS.sans}`
      ctx.textAlign = 'center'
      ctx.fillText(cfg.tagline, width / 2, atY(TYPE.tagline.y))
      ctx.textAlign = 'left'
    }
    return
  }

  // --- front ---

  // HVM's card carries a cream diagonal out of the top-right corner instead of
  // a centred mark.
  if (cfg.accentShape) {
    ctx.fillStyle = cfg.accentShape.color
    ctx.beginPath()
    ctx.moveTo(width * 0.52, 0)
    ctx.lineTo(width, 0)
    ctx.lineTo(width, height * 0.72)
    ctx.closePath()
    ctx.fill()
  }

  // A missing watermark should not cost the printer the whole card.
  const mark = cfg.watermark && loaded.get(cfg.watermark.src)
  if (mark) {
    drawContained(ctx, mark, {
      canvasWidth: width,
      canvasHeight: height,
      widthFraction: cfg.watermark.scale,
      x: cfg.watermark.x,
      y: cfg.watermark.y,
      opacity: cfg.watermark.opacity,
      crop: cfg.watermark.crop
    })
  }

  const name = (person.name || '').trim() || 'Voornaam Familienaam'
  const twoLine = cfg.nameLines === 2 && name.includes(' ')

  ctx.fillStyle = cfg.frontText
  ctx.font = `${TYPE.name.weight} ${px(TYPE.name.size)}px ${cfg.nameFont === 'serif' ? FONTS.serif : FONTS.sans}`

  if (twoLine) {
    const cut = name.lastIndexOf(' ')
    ctx.fillText(name.slice(0, cut), left, atY(TYPE.name.y))
    ctx.fillText(name.slice(cut + 1), left, atY(TYPE.nameLine2.y))
  } else {
    ctx.fillText(name, left, atY(TYPE.name.y))
  }

  const job = (person.job || '').trim()
  if (job) {
    ctx.fillStyle = cfg.frontMuted
    ctx.font = `${TYPE.job.weight} ${px(TYPE.job.size)}px ${FONTS.sans}`
    ctx.fillText(job, left, atY(twoLine ? TYPE.jobTwoLine.y : TYPE.job.y))
  }

  ctx.fillStyle = cfg.frontText
  ctx.font = `${TYPE.contact.weight} ${px(TYPE.contact.size)}px ${FONTS.sans}`

  let contactY = twoLine ? TYPE.contactTwoLine.y : TYPE.contact.y
  for (const line of [person.phone, person.email].map((v) => (v || '').trim()).filter(Boolean)) {
    ctx.fillText(line, left, atY(contactY))
    contactY += TYPE.contact.lineHeight
  }

  ctx.fillStyle = cfg.frontMuted
  ctx.font = `${TYPE.footer.weight} ${px(TYPE.footer.size)}px ${FONTS.sans}`
  ctx.fillText(company.websiteUrl.replace(/^https?:\/\//i, ''), left, atY(TYPE.footer.y))
  ctx.fillText(company.address, left, atY(TYPE.footer.y + TYPE.footer.lineHeight))
}

/** Exports a rendered canvas as a JPEG blob. Print wants no alpha channel. */
export const canvasToJpeg = (canvas, quality = 0.95) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
