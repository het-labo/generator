# Generator

Interne branding-tool van [Het Labo](https://www.het-labo.be). Medewerkers van vier bouwbedrijven stellen er zelf hun **e-mailhandtekening**, **profielfoto**, **visitekaartje** en **sticker** mee samen.

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
| `app/utils/business-card.js` | Kaartlayout in designeenheden; print-geometrie |
| `app/components/StickerGenerator.vue` | Sticker met vrij invulbare tekst |
| `app/utils/sticker.js` | Stickerlayout; zie de aanname over het formaat |
| `app/components/GeneratorLayout.vue` | Inklapbare zijbalk met de invoervelden |
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

Resultaat: `company-html/*.html` (~1,4 MB per stuk: shadcn-vue, de ingesloten
lettertypen en jsPDF).

Deze bestanden hebben geen buurbestanden om paden tegenaan te resolven, dus
`assetRoot` in `nuxt.config.ts` wijst ze naar de CDN. Logo's, overlays en de
PDF-fonts komen daar vandaan — **daarvoor is dus wél internet nodig**; de rest
werkt offline. Afbeeldingen blijven van `ASSET_BASE` komen, want inline base64 zou het bestand onwerkbaar groot maken.

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

### Wat lever je aan de drukker?

**De PDF.** Twee pagina's (voorkant, achterkant), tekst als vector met de
fonts ingesloten. `app/utils/business-card-pdf.js` bouwt hem met jsPDF uit
dezelfde designeenheden als het canvas-voorbeeld, dus scherm en drukwerk
kunnen niet uit elkaar lopen.

De JPG's zijn de uitwijkoptie. Die renderen op 600 dpi in plaats van 300,
omdat de footer op 4,8 pt staat: op 300 dpi is dat zo'n 20 pixels hoog, precies
waar JPEG-artefacten de letters beginnen aan te vreten.

> **De typografie is klein.** Naam 9,6 pt, contactgegevens 6,4 pt, footer
> 4,8 pt — dat volgt uit de Figma-maten. Veel drukkers hanteren 6 pt als
> ondergrens. Overleg dit met de drukker voor de eerste oplage.

jsPDF wordt pas ingeladen bij een klik op de PDF-knop (~380 KB los brok), en
de TTF-versies van de fonts staan in `public/assets/fonts/` — gegenereerd uit
dezelfde woff2 met `node scripts/build-pdf-fonts.mjs`.

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

## Stickers

`app/utils/sticker.js`, opgezet als de visitekaartjes: coördinaten zijn de
Figma-eenheden van het artboard (1016 × 638). Titel, tekst en voettekst zijn
vrij invulbaar; de tekst loopt automatisch door en het blok schuift mee als de
titel over meerdere regels gaat.

> **Aanname over het formaat.** Het Figma-bestand geeft geen millimeters. Dit
> gaat uit van 10 designeenheden per mm, dus **101,6 × 63,8 mm**, wat past bij
> de ronde maten elders in de spec (35 eenheden marge = 3,5 mm). Klopt dat
> niet, dan is `STICKER.widthMm/heightMm` het enige dat hoeft te wijzigen —
> de layout schaalt mee.

Alleen de Casa Futura-spec was gegeven; de andere drie volgen dezelfde
opbouw met hun eigen kleuren en logo's, en mogen nog nagekeken worden.

## Logo's

De correcte bestanden komen uit de huisstijlmappen op Drive. Let op de
varianten: HVM heeft `logo-hvm-white` (alles wit, voor de sticker) én
`logo-hvm-white-black` (witte dakvorm, zwarte woordmerk — voor het
visitekaartje). Casa Futura levert SVG's; de witte en lichte varianten in
`public/assets/logos/` zijn daaruit afgeleid door de stroke te vervangen.

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

