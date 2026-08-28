# TODO

Openstaande punten uit de code-analyse van 28-08-2026. Alles hier vraagt een
beslissing van jullie kant — het is bewust níet stilzwijgend "opgelost".

## Eerst verifiëren — blokkeert deploy

- [ ] **Plak één handtekening in Outlook (Windows).** De vaste breedte van
      580px is vervangen door een vloeiende tabel met een MSO ghost-table, zodat
      hij op mobiel niet meer horizontaal scrollt. Outlook hoort via het
      conditionele commentaar nog steeds 580px te krijgen. Dat is gemeten op
      375/600/900px in de browser, maar **niet** in echte Outlook — en juist
      daar ging het eerder mis. Klopt het niet: haal de twee `<!--[if mso]>`
      regels in `app/utils/signature.js` weg en zet de tabel terug op
      `width="580"`.

## Beslissen

- [ ] **De velden "Bedrijfsnaam" en "Achtervoegsel" doen niets.** Ze worden
      ingevuld en opgeslagen, maar komen nergens in de handtekening terecht
      (de oude `finalFullName` werd berekend en daarna weggegooid). Ofwel
      opnemen in de output, ofwel de velden verwijderen.
- [ ] **Profielfoto-upload in de handtekening staat uit.** Het upload-blok in
      `EmailSignatureGenerator.vue` heeft `class="hidden"`; `upload.php` en de
      rendering van de foto werken wel. Aanzetten of weghalen.
- [ ] **`public/upload.php` heeft geen enkele toegangscontrole.** Iedereen die
      de URL kent kan afbeeldingen op de server plaatsen. Minimaal een rate
      limit of een gedeeld token, zeker als het upload-blok weer aangaat.

- [ ] **md-bouw blijft boven de 5.000 tekens** (5.588 zonder foto, tegen ~4.300
      voor de andere drie). Resterende hefboom: kortere CDN-paden — 7
      afbeeldingen × ~70 tekens URL. `library.het-labo.be/g/fb-md.png` in
      plaats van `/generator/assets/icons/icon_facebook_md.png` scheelt ~215
      tekens, maar vraagt hernoemen op de server.
- [ ] **De handtekening is onleesbaar op een donkere mailachtergrond.** Zet de
      schakelaar "Donkere mail" in het voorbeeld aan: de donkerblauwe tekst
      valt weg. Oplosbaar met lichtere kleuren of een witte achtergrond op de
      tabel, maar dat raakt de huisstijl — bewuste keuze nodig.

## Techniek

- [ ] **Zet het project onder Git.** Er is nu geen versiebeheer en dus geen
      manier om een wijziging terug te draaien.
- [ ] **`.env` staat naast de code met FTP-wachtwoord in platte tekst.** Prima
      zolang de map lokaal blijft; noemenswaardig zodra er een repo of een
      tweede machine bij komt.
- [ ] **Telefoonopmaak is Belgisch en stil.** `formatPhoneNumber()` laat een
      buitenlands nummer ongemoeid doorlopen naar de handtekening. Prima nu,
      relevant zodra er een niet-Belgisch bedrijf bijkomt.

- [ ] **Bundel is bijna verdubbeld door shadcn-vue**: de losse HTML-bestanden
      gingen van 248 KB naar 468 KB, de gehoste app van ~230 KB naar 409 KB JS
      (135 KB gzipped — prima voor een interne tool). Wil je de losse bestanden
      lichter, dan is de `Select` voor rechtsvorm (3 opties) de dikste
      component om te vervangen door een native `<select>`.

## Bij het toevoegen van een bedrijf

Zie het stappenplan in `README.md`. Draai daarna altijd `npm run check` en
plak één handtekening echt in Outlook voordat je deployt.
