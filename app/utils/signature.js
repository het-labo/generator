// Builds the e-mail signature as an HTML string.
//
// Everything in here exists to survive Outlook on Windows, which renders
// pasted HTML through Word's engine. Word ignores margins, max-width and CSS
// filters, does not inherit fonts into table cells, and overrides link colors
// with its own built-in Hyperlink style. The comments below mark each place
// where the markup is shaped around one of those limitations — none of it is
// accidental, so change it only against a real Outlook test.
//
// Kept as a pure function (no Vue refs) so it can be unit-tested and reused
// outside the component.

import { ASSET_BASE } from '../../scripts/shared.mjs'
import { formatPhoneNumber } from './phone.js'

// WIDTH: fixed at 580px, not fluid. A percentage width stretches to the full
// compose window under Word's engine, which is why it was pinned here in the
// first place. The fluid-plus-MSO-ghost-table version that replaces it in most
// e-mail templates could not be verified against Outlook on Windows, and
// getting it wrong breaks every signature in the client that matters most. The
// cost of staying fixed is a validator warning about horizontal scrolling on
// phones. max-width and height:auto on the banner are kept: Word ignores both,
// so they cannot affect Outlook, and they help the image scale elsewhere.

// An explicit white background rather than transparent: a dark-mode client
// leaves the signature's own dark text and brand-coloured icons alone, and
// both disappear against a dark backdrop. Carrying its own background keeps
// the block readable wherever it lands. A pasted fragment cannot switch
// colours by itself — there is no <head> for a prefers-color-scheme rule and
// Outlook strips <style>.

// Word's engine doesn't inherit font-family/size from ancestor tables into
// cells, so this stack must be repeated inline on every text-bearing
// element instead of relying on inheritance from the outer <table>.
const FONT_STACK = 'font-family:Verdana,Arial,Helvetica,sans-serif;'


// Strips the indentation that keeps the templates below readable. Only
// whitespace that spans a newline BETWEEN two tags is removed — that never
// renders — and spacing inside style attributes is collapsed. Single spaces
// between inline elements are left alone, because the footer separators
// depend on them.
const minify = (html) =>
  html
    .replace(/>\s*\n\s*</g, '><')
    .replace(/style="([^"]*)"/g, (_, css) => `style="${css.replace(/\s*([:;])\s*/g, '$1').replace(/;$/, ';')}"`)
    .trim()

// Helper: safely coerce a size value like "70px" or "none" into a plain
// integer for use in HTML width/height attributes. Returns null when there
// is no valid numeric size, so the attribute can be omitted entirely rather
// than emitting an invalid value (e.g. width="none"). Keeps Outlook's
// Word-based rendering engine from mis-sizing images that rely on
// unsupported/ignored attribute values.
const pxNum = (val) => {
  if (!val || val === 'none') return null
  const n = parseInt(val, 10)
  return Number.isNaN(n) ? null : n
}

// Helper: builds a hyperlink whose visible text color is set on a nested
// <span> rather than on the <a> itself. Outlook on Windows renders pasted
// HTML through Word's engine, which applies its own built-in "Hyperlink"
// character style (blue + underline) to <a> tags — and that built-in style
// can override an inline color set directly on the anchor. Word DOES
// respect color set on a <span> nested inside the anchor, so wrapping the
// text this way keeps the correct color in Outlook while looking identical
// everywhere else (browsers, Gmail, Apple Mail, etc.).
const coloredLink = (href, color, text, extraAnchorStyle = '') => {
  return `<a href="${href}" style="text-decoration:none;${extraAnchorStyle}"><span style="color:${color};${FONT_STACK}">${text}</span></a>`
}

/** Strips a leading http(s):// — the UI shows that scheme as a fixed label. */
export const stripScheme = (url) => (url || '').replace(/^https?:\/\//i, '')

/**
 * The company half of the signature form, prefilled from a company's own
 * record. Shared by the generator UI and the regression check so both feed
 * the builder identical input.
 */
export const companyFormDefaults = (company) => ({
  companyName: company.name,
  companyAddendum: company.legalForm || 'bv',
  address: company.address,
  addressUrl: stripScheme(company.addressUrl),
  vat: company.vat,
  websiteUrl: stripScheme(company.websiteUrl),
  companyEmail: company.infoEmail,
  companyPhone: company.infoPhone,
  bannerUrl: stripScheme(company.websiteUrl),
  facebookUrl: stripScheme(company.facebookUrl),
  instagramUrl: stripScheme(company.instagramUrl),
  linkedinUrl: stripScheme(company.linkedinUrl)
})



export const buildSignatureHtml = ({ company, form, photo = '', assetBase = ASSET_BASE }) => {
  const name = form.name || 'Voornaam Familienaam'
  const job = (form.job || '').trim()
  const email = (form.email || '').trim()
  const phone = (form.phone || '').trim()
  
  const finalAddress = (form.address || '').trim()
  const finalVat = (form.vat || '').trim()
  const rawWebsiteUrl = (form.websiteUrl || '').trim()
  let finalWebsiteUrl = rawWebsiteUrl
  if (rawWebsiteUrl && !/^https?:\/\//i.test(rawWebsiteUrl)) {
    finalWebsiteUrl = 'https://' + rawWebsiteUrl
  }
  const finalWebsite = rawWebsiteUrl 
    ? rawWebsiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '') 
    : ""

  const footerTextColor = company.colorSecondary
  const footerSepColor = company.colorPrimary

  const footerParts1 = []
  const addressUrl = (form.addressUrl || '').trim()
  const finalAddressUrl = addressUrl ? 'https://' + addressUrl : ''
  if (finalAddress) {
    if (finalAddressUrl) {
      footerParts1.push(coloredLink(finalAddressUrl, footerTextColor, finalAddress))
    } else {
      footerParts1.push(`<span style="color:${footerTextColor};">${finalAddress}</span>`)
    }
  }

  const companyEmail = (form.companyEmail || '').trim()
  const companyPhone = (form.companyPhone || '').trim()
  
  if (companyPhone) {
    footerParts1.push(`<span style="white-space:nowrap;">${coloredLink('tel:' + companyPhone.replace(/\s+/g, ''), footerTextColor, companyPhone)}</span>`)
  }

  if (companyEmail) {
    footerParts1.push(coloredLink('mailto:' + companyEmail, footerTextColor, companyEmail))
  }

  const footerParts2 = []
  if (finalVat) footerParts2.push(`<span style="white-space:nowrap;color:${footerTextColor};">${finalVat}</span>`)
  if (finalWebsite) {
    footerParts2.push(coloredLink(finalWebsiteUrl, footerTextColor, finalWebsite))
  }

  const facebookUrl = (form.facebookUrl || '').trim()
  const finalFacebookUrl = facebookUrl ? 'https://' + facebookUrl : ''
  const instagramUrl = (form.instagramUrl || '').trim()
  const finalInstagramUrl = instagramUrl ? 'https://' + instagramUrl : ''
  const linkedinUrl = (form.linkedinUrl || '').trim()
  const finalLinkedinUrl = linkedinUrl ? 'https://' + linkedinUrl : ''

  // Note: no CSS filter() recoloring here — Outlook/Word ignores filter and
  // some clients strip the whole style attribute over it. The hosted icon
  // PNGs are already exported in each company's brand color.
  const socialLinks = []
  if (finalFacebookUrl) {
    socialLinks.push(`<a href="${finalFacebookUrl}" style="text-decoration:none; display:inline-block; vertical-align:middle;"><img src="${assetBase}/${company.iconFacebook}" alt="Facebook" height="12" style="display:inline-block; width:auto; height:12px; border:0; vertical-align:top;"></a>`)
  }
  if (finalInstagramUrl) {
    socialLinks.push(`<a href="${finalInstagramUrl}" style="text-decoration:none; display:inline-block; vertical-align:middle;"><img src="${assetBase}/${company.iconInstagram}" alt="Instagram" height="12" style="display:inline-block; width:auto; height:12px; border:0; vertical-align:top;"></a>`)
  }
  if (finalLinkedinUrl) {
    socialLinks.push(`<a href="${finalLinkedinUrl}" style="text-decoration:none; display:inline-block; vertical-align:middle;"><img src="${assetBase}/${company.iconLinkedin}" alt="LinkedIn" height="12" style="display:inline-block; width:auto; height:12px; border:0; vertical-align:top;"></a>`)
  }

  if (socialLinks.length > 0) {
    footerParts2.push(`<span style="white-space:nowrap;">${socialLinks.join('&nbsp;&nbsp;')}</span>`)
  }

  const allFooterParts = [...footerParts1, ...footerParts2]
  // Spacing around the pipe uses &nbsp; instead of padding — Word ignores
  // padding on <span>, which made the separators collapse together in Outlook.
  const separator = `&nbsp;<span style="color:${footerSepColor};font-weight:bold;">&nbsp;|&nbsp;</span>`
  const footerHtml = allFooterParts.map((part, index) => {
    return `${part}${index < allFooterParts.length - 1 ? separator : ''}`
  }).join(' ')
  const formattedPhone = formatPhoneNumber(phone)
  const telLink = 'tel:' + phone.replace(/\s+/g, '')

  const phoneRowHtml = phone ? `
    <tr>
        <td style="vertical-align:middle; padding-right:8px; padding-left:3px;">
            <img src="${assetBase}/${company.iconPhone}" alt="Phone" height="14" style="display:block; width:auto; height:14px; border:0;">
        </td>
        <td style="${FONT_STACK}font-size:15px; line-height:normal; vertical-align:middle; white-space:nowrap;">
            ${coloredLink(telLink, company.colorSecondary, formattedPhone, 'font-size:15px;')}
        </td>
    </tr>` : ''

  const emailRowHtml = email ? `
    <tr>
        <td style="vertical-align:middle; padding-right:8px; padding-left:2px;">
            <img src="${assetBase}/${company.iconEmail}" alt="Email" height="14" style="display:block; width:auto; height:14px; border:0;">
        </td>
        <td style="${FONT_STACK}font-size:15px; line-height:normal; vertical-align:middle; white-space:nowrap;">
            ${coloredLink('mailto:' + email, company.colorSecondary, email, 'font-size:15px;')}
        </td>
    </tr>` : ''

  // The 10px gap above the contact rows is a spacer row, not margin-top on
  // the table — Word ignores margins on tables, which glued the phone/email
  // block against the job title in Outlook.
  let contactTableHtml = (phone || email) ? `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td colspan="2" height="10" style="height:10px; line-height:10px; font-size:1px;">&nbsp;</td></tr>
      ${phoneRowHtml}
      ${phone && email ? '<tr><td colspan="2" height="6" style="height:6px; line-height:6px; font-size:1px;">&nbsp;</td></tr>' : ''}
      ${emailRowHtml}
    </table>` : ''

  const bannerUrl = (form.bannerUrl || '').trim()
  const finalBannerUrl = bannerUrl ? 'https://' + bannerUrl : ''
  const bannerImgSrc = `${assetBase}/${company.banner}`
  const bannerImgHtml = `<img width="580" alt="${company.name}" style="display:block;width:580px;max-width:100%;height:auto;border:0;" src="${bannerImgSrc}">`

  const bannerHtml = company.banner ? `
      <tr>
        <td colspan="2" style="padding:10px 0px 10px 0px; vertical-align:middle;">
            ${finalBannerUrl ? `<a href="${finalBannerUrl}" style="text-decoration:none; border:0;">${bannerImgHtml}</a>` : bannerImgHtml}
        </td>
      </tr>` : ''

  const logoWidthAttr = pxNum(company.logoWidth)
  const logoHeightAttr = pxNum(company.logoHeight)

  // Fixed pixel width (matching the 580px banner) instead of
  // width:100%/max-width — Word ignores max-width, so a percentage table
  // stretched to the full compose-window width in Outlook.
  return minify(`
    <table cellpadding="0" cellspacing="0" border="0" width="580" style="border-collapse:collapse; ${FONT_STACK} background-color:#ffffff; width:580px; text-align: left;">
      <tr>
        ${photo ? `<td width="76" style="padding:10px 0px 10px 0px; vertical-align:top; width:76px;">
          <img src="${photo}" alt="${name}" width="66" height="66" style="display:block; width:66px; height:66px; max-height:66px; max-width:66px; border-radius:50%; border:0;">
        </td>` : ''}
        <td style="padding:10px 0px 10px 0px; vertical-align:top; ${FONT_STACK}">
            <div style="${FONT_STACK}font-size:20px; line-height:24px; font-weight:bold; color:${company.colorSecondary}; margin:0; padding:0;">${name}</div>
          <div style="${FONT_STACK}font-size:14px; line-height:normal; color:${company.colorPrimary}; margin:0;">${job ? job + ' ' : ''}</div>
          ${contactTableHtml}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 0px 10px 0px; vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${assetBase}/${company.logo}" alt="${company.name}" ${logoWidthAttr ? `width="${logoWidthAttr}"` : ''} ${logoHeightAttr ? `height="${logoHeightAttr}"` : ''} style="display:block; width:auto; height:${company.logoHeight}; border:0; max-width:${company.logoWidth};">
              </td>
              <td style="vertical-align:middle; padding-left:16px;">
                <table cellpadding="0" cellspacing="0" border="0" width="500" style="border-collapse:collapse; width:500px; max-width:500px;">
                  <tr>
                    <td style="${FONT_STACK}font-size:12px; line-height:18px; color:${footerTextColor};">
                      ${footerHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${bannerHtml}
    </table>`)
}

