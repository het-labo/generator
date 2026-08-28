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

    websiteUrl: 'https://www.casafutura.com',
    emailPlaceholder: 'john@casafutura.com',
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

    websiteUrl: 'https://www.dakwerkenhvm.be',
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
