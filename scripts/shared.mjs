// Base URL that every asset referenced from a generated e-mail signature
// resolves against. Signatures end up in other people's mailboxes, so these
// URLs must be absolute and publicly reachable — a relative path breaks the
// moment the mail leaves this app.
//
// Shared between nuxt.config.ts (runtime config for the app) and the
// single-file patch script, so the host is defined exactly once.
export const ASSET_BASE = process.env.NUXT_PUBLIC_ASSET_BASE || 'https://library.het-labo.be/generator'
