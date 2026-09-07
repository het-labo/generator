// Rasterises the e-mail signature to an image.
//
// WHEN THIS IS THE RIGHT THING: only when a platform accepts nothing but an
// image. For actual e-mail the HTML on the clipboard is strictly better —
// see the note next to the download button.
//
// HOW: the signature is wrapped in an SVG <foreignObject> and loaded as an
// image, so the browser's own layout engine draws it and the result matches
// the preview exactly. No rendering library involved.
//
// Two constraints shape the code below:
//   - foreignObject content must be well-formed XML, so the markup goes
//     through XMLSerializer rather than being pasted in as a string.
//   - an SVG loaded into an Image may not reference external files at all, so
//     every logo and icon is inlined as a data URI first. Those are fetched
//     from the app's own origin, which also sidesteps the CDN sending no CORS
//     headers.

import { buildSignatureHtml } from './signature.js'

/** Rendered at 2x so the image still looks sharp on a high-density screen. */
const SCALE = 2

const fetchAsDataUri = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Kon ${url} niet lezen`))
    reader.readAsDataURL(blob)
  })
}

/**
 * Renders the signature and hands back a PNG blob plus its pixel size.
 *
 * @param company  a record from COMPANIES
 * @param form     the signature form values
 * @param assetUrl resolves a public/ path on the app's own origin
 */
export const buildSignatureImage = async ({ company, form, assetUrl }) => {
  // Same builder as the clipboard copy, but pointed at local assets: the CDN
  // sends no CORS headers, and an SVG image cannot fetch anything anyway.
  const html = buildSignatureHtml({ company, form, assetBase: assetUrl('assets').replace(/\/assets$/, '') })

  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:580px'
  holder.innerHTML = html
  document.body.appendChild(holder)

  try {
    await Promise.all(
      [...holder.querySelectorAll('img')].map(async (img) => {
        try {
          img.setAttribute('src', await fetchAsDataUri(img.src))
        } catch (err) {
          // A missing icon should not cost the whole image.
          console.error(err)
          img.remove()
        }
      })
    )

    const table = holder.firstElementChild
    const width = Math.ceil(table.getBoundingClientRect().width) || 580
    const height = Math.ceil(table.getBoundingClientRect().height)

    const xhtml = new XMLSerializer().serializeToString(table)
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<foreignObject width="100%" height="100%">` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px">${xhtml}</div>` +
      `</foreignObject></svg>`

    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Kon de handtekening niet omzetten naar een afbeelding'))
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })

    const canvas = document.createElement('canvas')
    canvas.width = width * SCALE
    canvas.height = height * SCALE

    const ctx = canvas.getContext('2d')
    // Signatures land on a white background in every mail client; without this
    // the PNG would be transparent and unreadable wherever it is dropped.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Kon geen PNG maken')

    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    holder.remove()
  }
}
