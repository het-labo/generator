// Print-ready PDF for the stickers — one page, vector text, embedded fonts.
// Mirrors sticker.js, so the preview and the print file cannot drift.

import { PDF_FONTS, PDF_FAMILY, fetchPdfFont, imageToCanvas, loadPdfImage } from './pdf-shared.js'
import { STICKER, STICKER_DESIGN, STICKER_TEXT, wrapLines } from './sticker.js'

/** design units -> millimetres */
const mm = (units) => (units * STICKER.widthMm) / STICKER_DESIGN.width

/** design units -> points */
const pt = (units) => (mm(units) / 25.4) * 72

/**
 * Measures with a canvas rather than jsPDF, so the wrapping matches the
 * on-screen preview exactly — the two engines round text widths differently.
 */
const measureContext = () => document.createElement('canvas').getContext('2d')

export const buildStickerPdf = async ({ company, content, assetUrl }) => {
  const { jsPDF } = await import('jspdf')

  const spec = company.sticker
  const pageWidth = STICKER.widthMm + STICKER.bleed * 2
  const pageHeight = STICKER.heightMm + STICKER.bleed * 2
  const offset = STICKER.bleed

  const [fonts, images] = await Promise.all([
    Promise.all(PDF_FONTS.map((f) => fetchPdfFont(assetUrl, f.file).then((data) => ({ ...f, data })))),
    (async () => {
      const loaded = new Map()
      await Promise.all(
        [spec.logo, spec.monogram].filter(Boolean).map((src) =>
          loadPdfImage(assetUrl, src)
            .then((img) => loaded.set(src, img))
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

  doc.setFillColor(spec.bg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  const place = (img, box) => {
    if (!img) return
    const scale = Math.min(box.width / img.width, box.height / img.height)
    const w = img.width * scale
    const h = img.height * scale
    doc.addImage(
      imageToCanvas(img),
      'PNG',
      offset + mm(box.x + (box.width - w) / 2),
      offset + mm(box.y + (box.height - h) / 2),
      mm(w),
      mm(h)
    )
  }

  place(images.get(spec.logo), spec.logoBox)
  place(images.get(spec.monogram), spec.monogramBox)

  const measure = measureContext()
  const centre = offset + mm(STICKER_DESIGN.width / 2)

  const line = (str, style, topUnits, align, xMm) => {
    doc.setFont(PDF_FAMILY[style.family] || 'WorkSans', 'normal', style.weight || 400)
    doc.setFontSize(pt(style.size))
    doc.setTextColor(spec.color)

    const options = { baseline: 'top' }
    if (align === 'center') options.align = 'center'
    if (style.letterSpacing) options.charSpace = mm(style.letterSpacing * style.size)

    doc.text(str, xMm, offset + mm(topUnits + (style.lineHeight - style.size) / 2), options)
  }

  measure.font = `${spec.title.weight || 400} ${spec.title.size}px ${spec.title.family}`
  measure.letterSpacing = spec.title.letterSpacing ? `${spec.title.letterSpacing * spec.title.size}px` : '0px'
  const titleLines = wrapLines(measure, (content.title || '').trim(), STICKER_TEXT.width)
  titleLines.forEach((l, i) => line(l, spec.title, STICKER_TEXT.titleTop + i * spec.title.lineHeight, 'center', centre))

  const bodyTop = STICKER_TEXT.bodyTop + Math.max(titleLines.length - 1, 0) * spec.title.lineHeight

  measure.font = `${spec.body.weight || 400} ${spec.body.size}px ${spec.body.family}`
  measure.letterSpacing = '0px'
  wrapLines(measure, content.body, STICKER_TEXT.width).forEach((l, i) =>
    line(l, spec.body, bodyTop + i * spec.body.lineHeight, 'center', centre)
  )

  line((content.footer || '').trim(), spec.footer, STICKER_TEXT.footerTop, 'left', offset + mm(STICKER_TEXT.footerX))

  return doc.output('blob')
}
