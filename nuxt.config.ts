import tailwindcss from '@tailwindcss/vite'

import { patchSingleHtmlForFileProtocol } from './scripts/patch-single-html-for-file-protocol.mjs'
import { ASSET_BASE } from './scripts/shared.mjs'

const isProd = process.env.NODE_ENV === 'production'
const singleCompany = process.env.NUXT_COMPANY || ''
const singleFile = process.env.NUXT_SINGLE_FILE === 'true'

// Where the app is served from, when that is not the root of a domain. The
// per-company installs live under /tools/e-mail-handtekening/ rather than at
// the root, and asset paths are baked into the build — so this has to be known
// at build time. Must start and end with a slash.
const basePath = process.env.NUXT_BASE_PATH || ''

export default defineNuxtConfig({
  ssr: false,

  modules: ['shadcn-nuxt', 'nuxt-single-html'],

  css: [
    '~/assets/css/fonts.css',
    // Without this the toasts render unstyled at the bottom of the document
    // instead of floating over the page.
    'vue-sonner/style.css',
    '~/assets/css/main.css'
  ],

  // Tailwind v4 ships as a Vite plugin rather than a Nuxt module.
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The single-file build is opened straight from disk: there are no
      // sibling files to fetch, so the fonts have to be base64'd into the CSS
      // or the cards fall back to system typefaces.
      assetsInlineLimit: singleFile ? 512 * 1024 : 4096
    }
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

  router: {
    options: {
      hashMode: singleFile
    }
  },

  singleHtml: {
    enabled: singleFile,
    deleteInlinedFiles: true,
    output: '[name].html'
  },

  runtimeConfig: {
    public: {
      // Set via NUXT_COMPANY at build time to produce a standalone build for
      // a single company, hosted at the root of their own domain.
      companyId: singleCompany,

      // Absolute host for images embedded in generated signatures. Those URLs
      // are resolved from inside somebody else's mailbox, so they can never
      // be relative. Override with NUXT_PUBLIC_ASSET_BASE.
      assetBase: ASSET_BASE,

      // Where the app loads public/ assets from at runtime — overlays, card
      // logos, the PDF fonts. Normally that is just baseURL, but the
      // single-file build is opened straight from disk with baseURL './', and
      // there are no sibling files there to resolve against.
      assetRoot: singleFile ? `${ASSET_BASE}/` : undefined,

      // Gate on the company-details fields. This is a guard against accidental
      // edits, not a security control — the app is fully client-side, so the
      // value is readable in the shipped bundle. Override with
      // NUXT_PUBLIC_UNLOCK_CODE.
      unlockCode: 'd5E6mQ2og0K'
    }
  },

  app: {
    // Important:
    // For a true single file opened through file://, avoid /generator/ or /
    // because those are absolute paths.
    baseURL: singleFile ? './' : basePath || (singleCompany ? '/' : isProd ? '/generator/' : '/'),

    head: {
      title: 'Generator',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],

      // For true single-file output, either remove the favicon
      // or inline/import it another way. /favicon.svg is still a separate public file.
      link: singleFile ? [] : [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.svg' }]
    }
  }
})
