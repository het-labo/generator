# TODO

Openstaande punten uit de code-analyse van 28-08-2026. Alles hier vraagt een
beslissing van jullie kant — het is bewust níet stilzwijgend "opgelost".

## Afgesloten beslissingen

- [x] **Stickerformaat bevestigd** op 101,6 × 63,8 mm (10 designeenheden per
      mm), zoals aangenomen in `sticker.js`.

- [x] **Vaste breedte van 580px behouden.** De vloeiende variant met MSO
      ghost-table loste de mobiele scroll-waarschuwing van de validator op,
      maar was niet te testen tegen Outlook op Windows — en die route is precies
      waar het eerder misging. Bij een fout breekt élke handtekening in de
      belangrijkste client, tegenover een waarschuwing over horizontaal
      scrollen op telefoons. Teruggezet op de bewezen geometrie. Krijg je ooit
      toegang tot een Windows-machine, dan is het de moeite om alsnog te
      testen: de ghost-table staat beschreven in de comment bovenaan
      `signature.js`.

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
- [x] **Donkere mailachtergrond.** Opgelost door de handtekening een eigen
      witte achtergrond te geven in plaats van transparant; tekst, logo en
      iconen blijven zo leesbaar waar hij ook belandt. De simulatieschakelaar
      in het voorbeeld is vervallen. Let op: enkele clients (o.a. Gmail-app,
      Outlook.com) forceren soms alsnog hun eigen inversie — controleer dat bij
      de Outlook-test.

## Techniek

- [ ] **Zet het project onder Git.** Er is nu geen versiebeheer en dus geen
      manier om een wijziging terug te draaien.
- [ ] **`.env` staat naast de code met FTP-wachtwoord in platte tekst.** Prima
      zolang de map lokaal blijft; noemenswaardig zodra er een repo of een
      tweede machine bij komt.
- [ ] **De vier banner-bestanden zijn leeg.** `banner-md/cf/ge/hvm.png` zijn
      byte-identiek (zelfde MD5) en volledig transparant: 1160 × 20 px waarin
      elke pixel `(0,0,0,0)` is. Elke handtekening bevat dus een onzichtbare
      strook plus een klikbare link eromheen. Ofwel echte banners aanleveren,
      ofwel de bannerrij uit `signature.js` halen — dat scheelt ~150 tekens en
      een HTTP-verzoek per handtekening.
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
