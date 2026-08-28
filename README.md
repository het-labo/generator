# Generator

Interne branding-tool van [Het Labo](https://www.het-labo.be). Medewerkers van vier bouwbedrijven stellen er zelf hun **e-mailhandtekening**, **profielfoto** en **visitekaartje** mee samen.

Nuxt 4 (SPA, `ssr: false`) + Vue 3 + Tailwind v4 + [shadcn-vue](https://www.shadcn-vue.com). Volledig client-side; het enige server-onderdeel is `public/upload.php`, dat geüploade profielfoto's een permanente URL geeft.

> shadcn-vue is de Vue-poort van shadcn/ui — ui.shadcn.com zelf is React. Zelfde componenten en API, gebouwd op [reka-ui](https://reka-ui.com). Componenten staan als broncode in `app/components/ui/` en mogen aangepast worden; ze komen niet uit een package.

## Snel starten

```bash
npm install
npm run dev
```

Draait op http://localhost:3000. De startpagina toont de bedrijvenkiezer, `/:slug` opent één bedrijf (`/md-bouw`, `/casa-futura`, `/gevanco`, `/hvm`).

## Waar wat staat

| Pad | Rol |
| --- | --- |
| `app/utils/companies.js` | **Enige bron** van bedrijfsdata: kleuren, logo's, adressen, socials, overlays |
| `app/utils/signature.js` | Bouwt de handtekening-HTML. Zie waarschuwing hieronder |
| `app/components/EmailSignatureGenerator.vue` | Formulier + live preview van de handtekening |
| `app/components/ProfilePhotoGenerator.vue` | Canvas: ronde crop, zwart-wit, huisstijl-overlay |
| `app/components/BusinessCardGenerator.vue` | Visitekaartjes, voor- en achterkant, drukklaar |
| `app/utils/business-card.js` | Kaartlayout in millimeters; print-geometrie |
| `app/components/GeneratorShell.vue` | Gedeelde chrome (header, tabs, footer) voor beide pagina's |
| `app/components/SignaturePreview.vue` | Voorbeeldpaneel met desktop/mobiel, donkere-mail en tekenteller |
| `app/components/ui/` | shadcn-vue componenten (broncode, aanpasbaar) |
| `app/assets/css/main.css` | Tailwind v4-opzet en de design-tokens |
| `scripts/check-signatures.mjs` | Regressietest op de gegenereerde handtekeningen |
| `scripts/shared.mjs` | `ASSET_BASE` — de absolute host voor afbeeldingen in handtekeningen |
| `public/assets/` | Alle afbeeldingen. Worden ook naar de CDN gedeployed |

## Een bedrijf toevoegen

Eén entry in `app/utils/companies.js` volstaat — de overzichtspagina, de `/:slug`-route, de handtekening en de overlays lezen daar allemaal uit.

1. Voeg de assets toe onder `public/assets/` (logo, banner, telefoon/e-mail/social-iconen, twee overlays).
2. Voeg een entry toe aan `COMPANIES` met een unieke `id` en `slug`.
3. Wil je ook een standalone build? Voeg de `id` toe aan de lijst in `scripts/generate-company-html.mjs`.
4. Draai `npm run check:update` en controleer de diff in `scripts/__fixtures__/`.

> De social-iconen worden **niet** met CSS ingekleurd — Outlook negeert `filter`. Exporteer per bedrijf een PNG in de eigen huisstijlkleur.

## De handtekening-HTML aanpassen

`app/utils/signature.js` is geen normale HTML. Outlook op Windows rendert geplakte HTML via de engine van Word, die marges, `max-width` en CSS-filters negeert, lettertypes niet overerft in tabelcellen, en linkkleuren overschrijft met zijn eigen Hyperlink-stijl. Elke omweg in dat bestand staat becommentarieerd.

Er is een regressietest die de exacte output per bedrijf vastlegt:

```bash
npm run check
```

Is een verschil bedoeld? **Plak het resultaat eerst echt in Outlook**, en pas dan:

```bash
npm run check:update
```

## Bouwen en deployen

### 1. Gedeelde site (standaard)

Alle bedrijven samen onder `/generator/`, naar de gedeelde FTP-map.

```bash
npm run shipit
```

Of apart: `npm run generate` (naar `.output/public`) en `npm run deploy`.

### 2. Standalone per bedrijf

Voor hosting op de root van een eigen domein (bv. `signature.mdbouw.be`):

```bash
NUXT_COMPANY=md npm run generate
```

Bedrijfscodes: `md`, `cf`, `gv`, `hvm`.

Deployen naar een andere server:

```bash
FTP_HOST=ftp.companyname.be \
FTP_USER=gebruiker \
FTP_PASSWORD=wachtwoord \
FTP_REMOTE_ROOT=/public_html/ \
npm run deploy
```

### 3. Eén los HTML-bestand per bedrijf

Zelfstandige bestanden die ook via `file://` werken — handig om door te sturen.

```bash
npm run generate:companies
```

Resultaat: `company-html/*.html` (~650 KB per stuk; shadcn-vue en de ingesloten lettertypen). Afbeeldingen blijven van `ASSET_BASE` komen, want inline base64 zou het bestand onwerkbaar groot maken.

## Visitekaartjes

`app/utils/business-card.js` tekent beide zijden op canvas en exporteert JPG.

**Coördinaten zijn Figma-eenheden, geen pixels of millimeters.** Het artboard
is 1200 × 776,47 en dát is het snijformaat; de canvas wordt één keer geschaald.
Waarden uit de Figma-CSS kunnen dus rechtstreeks in `COMPANIES[..].card`.

| | |
| --- | --- |
| Snijformaat | 85 × 55 mm = 1200 × 776,47 designeenheden |
| Afloop | 3 mm rondom → 91 × 61 mm |
| Resolutie | 300 dpi → 1075 × 720 px |
| Kleurruimte | sRGB — browsers exporteren geen CMYK |

`front` is de **logo-zijde**, `back` de zijde met de persoonsgegevens — zoals
de Figma-bestanden heten.

### Lettertypen

De kaarten zijn gezet in Work Sans, Source Sans 3, Lato, Libre Baskerville en
Roboto Mono. Die worden **zelf gehost** vanuit `app/assets/fonts/` — zie
`app/assets/css/fonts.css` voor de herkomst, de licenties en hoe je ze
bijwerkt. Alleen woff2, alleen de latin-subset.

Twee vervangingen ten opzichte van de Figma-spec, omdat de originelen niet
distribueerbaar zijn: `Baskerville` (macOS-systeemfont) → **Libre
Baskerville**, en `Source Sans Pro` → **Source Sans 3** (dezelfde familie,
upstream hernoemd).

Canvas laadt een webfont **niet** automatisch: `ctx.font` op een face die de
pagina zelf nergens toont laat die ongeladen, en dan tekent hij stilzwijgend
met een fallback. `ensureCardFonts()` in `business-card.js` vraagt daarom elke
face expliciet op vóór de eerste render.

In de single-file build worden de fonts als base64 ingesloten
(`assetsInlineLimit` in `nuxt.config.ts`), dus ook die bestanden zetten de
kaarten correct — ze werken volledig offline.

De snijlijnen in het voorbeeld zijn een overlay en zitten **niet** in de
export — de drukker krijgt schone bestanden.

## Configuratie

FTP-gegevens komen uit `.env` (niet in versiebeheer):

```
FTP_USER=…
FTP_PASSWORD=…
FTP_HOST=…
```

Build-time env vars:

| Variabele | Effect |
| --- | --- |
| `NUXT_COMPANY` | Standalone build voor één bedrijf (`md`, `cf`, `gv`, `hvm`) |
| `NUXT_SINGLE_FILE` | Bouwt naar één HTML-bestand met hash-routing |
| `NUXT_PUBLIC_ASSET_BASE` | Host voor afbeeldingen in handtekeningen |
| `NUXT_PUBLIC_UNLOCK_CODE` | Code voor het ontgrendelen van de bedrijfsvelden |

De unlock-code is een drempel tegen vergissingen, geen beveiliging: de app is volledig client-side, dus de waarde staat leesbaar in de gepubliceerde bundle.

## Componenten toevoegen

```bash
npx shadcn-vue@latest add <naam>
```

Landt in `app/components/ui/` en wordt automatisch geïmporteerd door Nuxt.
Gebruikt `@lucide/vue` voor iconen — niet `lucide-vue-next`, dat is een andere package.

