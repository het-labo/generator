import tailwindcss from '@tailwindcss/vite'

import { patchSingleHtmlForFileProtocol } from './scripts/patch-single-html-for-file-protocol.mjs'
import { ASSET_BASE } from './scripts/shared.mjs'

const isProd = process.env.NODE_ENV === 'production'
const singleCompany = process.env.NUXT_COMPANY || ''
const singleFile = process.env.NUXT_SINGLE_FILE === 'true'

export default defineNuxtConfig({
  ssr: false,

  modules: ['shadcn-nuxt', 'nuxt-single-html'],

  css: ['~/assets/css/main.css'],

  // Tailwind v4 ships as a Vite plugin rather than a Nuxt module.
  vite: {
    plugins: [tailwindcss()]
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
    baseURL: singleFile ? './' : singleCompany ? '/' : isProd ? '/generator/' : '/',

    head: {
      title: 'Generator',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],

      // For true single-file output, either remove the favicon
      // or inline/import it another way. /favicon.svg is still a separate public file.
      link: [
        // Typefaces the business cards are set in. They are drawn onto a
        // canvas, so they must be loaded before the first render — see
        // BusinessCardGenerator. The standalone single-file build has no
        // network, and falls back to the stacks in business-card.js.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600&family=Source+Sans+3:wght@400&family=Lato:wght@400&family=Libre+Baskerville:wght@400;700&family=Roboto+Mono:wght@400&display=swap'
        },
        ...(singleFile ? [] : [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.svg' }])
      ]
    }
  }
})
