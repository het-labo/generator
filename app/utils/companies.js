// Single source of truth for every company this generator serves.
//
// Adding a company means adding one entry here — the overview page, the
// /:slug route, the signature generator and the profile-photo overlays all
// read from this object. Nothing else needs to know the company exists.
//
// Asset paths are relative to the public/ root on purpose: the app resolves
// them against baseURL for on-screen use, while the signature builder
// resolves them against the absolute ASSET_BASE, because those URLs have to
// keep working inside somebody else's mailbox.

import { FONT_STACKS } from './business-card.js'

export const COMPANIES = {
  md: {
    id: 'md',
    slug: 'md-bouw',
    name: 'MD Bouw',
    legalName: 'MD BOUW BV',
    legalForm: 'bv',
    description: 'Nieuwbouw en renovatie',

    // Logo shown in the app chrome (overview card, page header).
    navLogo: 'assets/logos/logo-md.png',

    // Logo baked into the signature. Width/height double as HTML attributes
    // (Outlook needs those) and as CSS, hence the unit-carrying strings;
    // 'none' means "no explicit width", see pxNum() in signature.js.
    logo: 'assets/logos/logo-md-primair.png',
    logoWidth: 'none',
    logoHeight: '70px',

    colorPrimary: '#00555B',
    colorSecondary: '#17313C',

    websiteUrl: 'https://www.mdbouw.be',
    emailPlaceholder: 'john@mdbouw.be',
    address: 'Brulens 28B — 2275 Gierle',
    addressUrl:
      'www.google.com/maps/place/MD+Bouw/@51.2664632,4.8572653,17z/data=!3m1!4b1!4m6!3m5!1s0x47c3f0077d3abc63:0x9d426abeac8a444!8m2!3d51.2664599!4d4.8621308!16s%2Fg%2F11c3sqkdtd',
    vat: 'BE 0826 599 257',
    infoEmail: 'info@mdbouw.be',
    infoPhone: '+32 14 49 04 16',

    banner: 'assets/img/banner-md.png',
    iconPhone: 'assets/icons/icon-phone-md.png',
    iconEmail: 'assets/icons/icon-email-md.png',
    iconFacebook: 'assets/icons/icon_facebook_md.png',
    iconInstagram: 'assets/icons/icon_instagram_md.png',
    iconLinkedin: 'assets/icons/icon_linkedin_md.png',

    facebookUrl: 'www.facebook.com/mdbouw.gierle',
    instagramUrl: 'https://www.instagram.com/mdbouw_altijdconstructief/',
    linkedinUrl: 'www.linkedin.com/company/md-bouw',

    // Business card. Every number is a design unit from the Figma artboard
    // (1200 x 776.47 = the trim area); see business-card.js.
    card: {
      front: {
        bg: '#17313C',
        logo: 'assets/logos/logo-md-white.png',
        logoWidth: 373.65,
        logoCx: 600,
        logoCy: 388.235
      },
      back: {
        bg: '#FFFAF6',
        color: '#17313C',
        x: 85,
        y: { name: 85, job: 137, phone: 218, email: 259, website: 631.47, address: 661.47 },
        type: {
          name: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 48 },
          job: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 },
          contact: { family: FONT_STACKS.sourceSans, size: 32, lineHeight: 40 },
          footer: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 }
        },
        watermark: {
          src: 'assets/logos/logo-md-primair.png',
          // The file also carries the wordmark; the card wants only the circle.
          crop: { x: 0.32, y: 0.01, w: 0.36, h: 0.51 },
          x: 460,
          y: 85,
          width: 904.7,
          height: 904.73,
          opacity: 0.05
        }
      }
    },
    sticker: {
      bg: '#17313C',
      color: '#FFFFFF',
      logo: 'assets/logos/logo-md-white.png',
      logoBox: { x: 35, y: 35, width: 190, height: 132 },
      monogram: 'assets/logos/monogram-md-white.png',
      // Bottom-right on the same 35-unit margin as the logo and footer.
      monogramBox: { x: 863.2, y: 487, width: 117.8, height: 116 },
      title: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 52, letterSpacing: -0.015 },
      body: { family: FONT_STACKS.sourceSans, weight: 400, size: 22, lineHeight: 32 },
      footer: { family: FONT_STACKS.sourceSans, weight: 400, size: 18, lineHeight: 26 }
    },
    overlays: [
      { id: 'full', src: 'assets/overlays/full.png', label: 'Volledig' },
      { id: 'half', src: 'assets/overlays/half.png', label: 'Gradient' }
    ]
  },

  cf: {
    id: 'cf',
    slug: 'casa-futura',
    name: 'Casa Futura',
    legalName: 'CASA FUTURA BV',
    legalForm: 'bv',
    description: 'Energiezuinige woningen',

    navLogo: 'assets/logos/logo-cf.png',
    logo: 'assets/logos/logo-cf.png',
    logoWidth: '78px',
    logoHeight: '44px',

    colorPrimary: '#4E5A54',
    colorSecondary: '#190A0A',

    websiteUrl: 'https://www.casafutura.be',
    emailPlaceholder: 'john@casafutura.be',
    address: 'Schommestraat 7 — 2200 Herentals',
    addressUrl: '',
    vat: 'BE 0891 999 726',
    infoEmail: 'info@casafutura.be',
    infoPhone: '+32 14 26 18 83',

    banner: 'assets/img/banner-cf.png',
    iconPhone: 'assets/icons/icon-phone-cf.png',
    iconEmail: 'assets/icons/icon-email-cf.png',
    iconFacebook: 'assets/icons/icon_facebook_cf.png',
    iconInstagram: 'assets/icons/icon_instagram_cf.png',
    iconLinkedin: 'assets/icons/icon_linkedin_cf.png',

    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',

    card: {
      front: {
        bg: '#4E5A54',
        logo: 'assets/logos/logo-cf-white.svg',
        logoWidth: 351.91,
        logoCx: 600,
        logoCy: 388.235,
        tagline: {
          text: 'waar wonen toekomst krijgt',
          family: FONT_STACKS.lato,
          size: 28,
          lineHeight: 34,
          top: 700,
          color: '#FFFAF6',
          opacity: 0.75
        }
      },
      back: {
        bg: '#FFFAF6',
        color: '#4E5A54',
        x: 85,
        y: { name: 85, job: 137, phone: 218, email: 256, website: 633.47, address: 662.47 },
        type: {
          name: { family: FONT_STACKS.baskerville, weight: 600, size: 48, lineHeight: 48 },
          job: { family: FONT_STACKS.lato, size: 24, lineHeight: 29 },
          contact: { family: FONT_STACKS.lato, size: 32, lineHeight: 38 },
          footer: { family: FONT_STACKS.lato, size: 24, lineHeight: 29 }
        },
        watermark: {
          src: 'assets/logos/monogram-cf-light.svg',
          x: 959.52,
          y: 307.48,
          width: 155.52,
          height: 383.96
        }
      }
    },
    // Sticker. Design units are the Figma artboard, 1016 x 638; see sticker.js.
    sticker: {
      bg: '#4E5A54',
      color: '#FFFFFF',
      logo: 'assets/logos/logo-cf-white.svg',
      logoBox: { x: 35, y: 35, width: 220, height: 122.31 },
      monogram: 'assets/logos/monogram-cf-white.svg',
      monogramBox: { x: 930, y: 483, width: 51.34, height: 120 },
      title: { family: FONT_STACKS.baskerville, weight: 400, size: 48, lineHeight: 52, letterSpacing: -0.015 },
      body: { family: FONT_STACKS.lato, weight: 400, size: 22, lineHeight: 32 },
      footer: { family: FONT_STACKS.lato, weight: 400, size: 18, lineHeight: 26 }
    },
    overlays: [
      { id: 'full-cf', src: 'assets/overlays/full-cf.png', label: 'Volledig' },
      { id: 'half-cf', src: 'assets/overlays/half-cf.png', label: 'Gradient' }
    ]
  },

  gv: {
    id: 'gv',
    slug: 'gevanco',
    name: 'Gevanco',
    legalName: 'GEVANCO BVBA',
    legalForm: 'bvba',
    description: 'Industriële betonwerken',

    navLogo: 'assets/logos/logo-ge.png',
    logo: 'assets/logos/logo-ge.png',
    logoWidth: 'none',
    logoHeight: '30px',

    colorPrimary: '#B1805C',
    colorSecondary: '#0A395C',

    websiteUrl: 'https://www.gevanco.be',
    emailPlaceholder: 'john@gevanco.be',
    address: 'Servaas Daemsstraat 150 — 2200 Noorderwijk',
    addressUrl:
      'www.google.com/maps/place/Van+den+Bulck+Ernest+%26+Zn+bvba/@51.1487831,4.8215116,17z/data=!3m1!4b1!4m6!3m5!1s0x47c1519a1941e49d:0x95176c365692c4d1!8m2!3d51.1487798!4d4.8240919!16s%2Fg%2F11tj_4d67',
    vat: 'BE 0443 062 544',
    infoEmail: 'info@gevanco.be',
    infoPhone: '+32 14 26 18 83',

    banner: 'assets/img/banner-ge.png',
    iconPhone: 'assets/icons/icon-phone-ge.png',
    iconEmail: 'assets/icons/icon-email-ge.png',
    iconFacebook: 'assets/icons/icon_facebook_ge.png',
    iconInstagram: 'assets/icons/icon_instagram_ge.png',
    iconLinkedin: 'assets/icons/icon_linkedin_ge.png',

    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',

    card: {
      front: {
        bg: '#0B395C',
        logo: 'assets/logos/logo-ge-white.png',
        logoWidth: 500,
        logoCx: 600,
        logoCy: 388.235
      },
      back: {
        bg: '#FFFAF6',
        color: '#0B395C',
        x: 85,
        y: { name: 97.235, job: 149.235, phone: 231.235, email: 271.235, website: 619.235, address: 649.235 },
        type: {
          name: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 48 },
          job: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 },
          contact: { family: FONT_STACKS.sourceSans, size: 32, lineHeight: 40 },
          footer: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 }
        },
        watermark: {
          src: 'assets/logos/logo-ge.png',
          // The 'G' mark at the far left of the wordmark file.
          crop: { x: 0, y: 0, w: 0.155, h: 0.72 },
          x: 694,
          y: 188,
          width: 400,
          height: 400,
          opacity: 0.04
        }
      }
    },
    sticker: {
      bg: '#0B395C',
      color: '#FFFFFF',
      logo: 'assets/logos/logo-ge-white.png',
      logoBox: { x: 35, y: 35, width: 260, height: 55 },
      monogram: 'assets/logos/monogram-ge-white.png',
      monogramBox: { x: 873, y: 495, width: 108, height: 108 },
      title: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 52, letterSpacing: -0.015 },
      body: { family: FONT_STACKS.sourceSans, weight: 400, size: 22, lineHeight: 32 },
      footer: { family: FONT_STACKS.sourceSans, weight: 400, size: 18, lineHeight: 26 }
    },
    overlays: [
      { id: 'full-ge', src: 'assets/overlays/full-ge.png', label: 'Volledig' },
      { id: 'half-ge', src: 'assets/overlays/half-ge.png', label: 'Gradient' }
    ]
  },

  hvm: {
    id: 'hvm',
    slug: 'hvm',
    name: 'Dakwerken HVM',
    legalName: 'DAKWERKEN HVM BV',
    legalForm: 'bv',
    description: 'Dakwerken en gevelbekleding',

    navLogo: 'assets/logos/logo-hvm.png',
    logo: 'assets/logos/logo-hvm.png',
    logoWidth: '157px',
    logoHeight: '44px',

    colorPrimary: '#B90000',
    colorSecondary: '#190A0A',

    // Without the www: that host has no DNS record at all, so the link in
    // every signature failed. This one resolves and redirects to the site.
    websiteUrl: 'https://dakwerkenhvm.be',
    emailPlaceholder: 'john@dakwerkenhvm.be',
    address: 'Brulens 28B — 2275 Gierle',
    addressUrl:
      'www.google.com/maps/place/Brulens+28b,+2275+Lille/@51.2664632,4.8595505,17z/data=!3m1!4b1!4m6!3m5!1s0x47c6ad41c4eb5fa1:0x578109beade2d50f!8m2!3d51.2664599!4d4.8621308!16s%2Fg%2F11nnkqt_9q',
    vat: 'BE 0534 617 082',
    infoEmail: 'info@dakwerkenhvm.be',
    infoPhone: '+32 3 296 05 38',

    banner: 'assets/img/banner-hvm.png',
    iconPhone: 'assets/icons/icon-phone-hvm.png',
    iconEmail: 'assets/icons/icon-email-hvm.png',
    iconFacebook: 'assets/icons/icon_facebook_hvm.png',
    iconInstagram: 'assets/icons/icon_instagram_hvm.png',
    iconLinkedin: 'assets/icons/icon_linkedin_hvm.png',

    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',

    card: {
      front: {
        bg: '#B90000',
        // White mark with black wordmark — the variant the approved card uses.
        logo: 'assets/logos/logo-hvm-white-black.png',
        logoWidth: 332,
        logoCx: 600,
        logoCy: 388.235,
        tagline: {
          text: 'vakwerk tot in de nok',
          family: FONT_STACKS.workSans,
          size: 31.5,
          lineHeight: 37,
          top: 699,
          color: '#FFFFFF',
          opacity: 0.75
        }
      },
      back: {
        bg: '#FFFFFF',
        color: '#000000',
        x: 85,
        nameLines: 2,
        y: { name: 81.235, job: 177.235, phone: 259.235, email: 299.235, website: 635.235, address: 665.235 },
        type: {
          name: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 48 },
          job: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 },
          contact: { family: FONT_STACKS.sourceSans, size: 32, lineHeight: 40 },
          footer: { family: FONT_STACKS.sourceSans, size: 24, lineHeight: 30 }
        },
        // White card with a cream wedge left showing in the top-right corner.
        wedgeColor: '#FFFAF6',
        wedge: { x: 600, y: 600 }
      }
    },
    sticker: {
      bg: '#B90000',
      color: '#FFFFFF',
      logo: 'assets/logos/logo-hvm-white.png',
      logoBox: { x: 35, y: 35, width: 150, height: 172.6 },
      monogram: 'assets/logos/monogram-hvm-white.png',
      monogramBox: { x: 873, y: 495, width: 108, height: 108 },
      title: { family: FONT_STACKS.workSans, weight: 600, size: 48, lineHeight: 52, letterSpacing: -0.015 },
      body: { family: FONT_STACKS.sourceSans, weight: 400, size: 22, lineHeight: 32 },
      footer: { family: FONT_STACKS.sourceSans, weight: 400, size: 18, lineHeight: 26 }
    },
    overlays: [
      { id: 'full-hvm', src: 'assets/overlays/full-hvm.png', label: 'Volledig' },
      { id: 'half-hvm', src: 'assets/overlays/half-hvm.png', label: 'Gradient' }
    ]
  }
}

export const COMPANY_LIST = Object.values(COMPANIES)

export const DEFAULT_COMPANY_ID = 'md'

/** Look up a company by its short id ('md'), or null when unknown. */
export const companyById = (id) => COMPANIES[id] || null

/** Look up a company by its URL slug ('md-bouw'), or null when unknown. */
export const companyBySlug = (slug) => COMPANY_LIST.find((c) => c.slug === slug) || null
