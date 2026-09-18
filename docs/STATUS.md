# Grattini V3 — STATUS

**Fonte di verità unica del redesign.** Se un altro documento contraddice
questo file, vale questo file e l'altro va corretto.

Ultimo aggiornamento: 2026-09-18 · riferimento codice: `4235144`

## 1. Come è fatto il progetto oggi

- Il repository contiene **il gioco V2 completo** (tag `full-game-baseline`,
  da V2 `78d27a3`), non una shell V3 pulita. La strategia "shell pulita" è
  stata abbandonata: si ridisegna **una schermata completa alla volta** sopra
  il codice esistente.
- Il router e buona parte delle schermate vivono ancora in
  `src/scratchlite.jsx` (≈4.000 righe, stili inline).
- Il tag `combat-pilot-approved` è una **reference** di energia e durezza, non
  un layout da incollare. Il tentativo di reintrodurlo (`ffa7c9f`) è stato
  revertito (`90c9e0b`).

## 2. Decisioni bloccate

1. **Direzione visiva:** struttura *Tabacchi Terminale* + stampa imperfetta di
   *Stampa Fuori Registro* ([VISUAL-DIRECTION-DECISION.md](VISUAL-DIRECTION-DECISION.md)).
2. **Concept:** *La macchina della fortuna* — dialoghi come scontrini, mappa
   come foglio perforato, premi come timbri, shop come banco fisico.
3. **Contenuto intoccabile:** meccaniche, bilanciamento, dialoghi, esclusive,
   notizie, gimmick, griglie e vincitori. Il redesign cambia solo la
   presentazione; i bug funzionali vanno in [BUG-REGISTER.md](BUG-REGISTER.md)
   con commit separati.
4. **Combat:** ogni cella mostra prima della grattata un segno grande e
   ridondante — `▲` BOTTA, `◆` PARATA, `€` PREMIO — mai solo colore o testo
   piccolo.
5. **Grattata fisica:** pennello largo e interpolato, audio secco/cartaceo che
   segue il puntatore, alternativa da tastiera equivalente.
6. **Unghie:** cinque unghie selezionabili; il dito selezionato è il cursore
   (niente freccia, niente mano intera).
7. **Pixel art reale:** regole tecniche in
   [11-PIXEL-ART-BIBLE.md](redesign/11-PIXEL-ART-BIBLE.md). Vietati blur,
   vetro, glow, gradienti morbidi, angoli arrotondati ornamentali e raster
   filtrati.
8. **Tipografia:** Tiny5 (OFL 1.1), già in `src/data/theme.js`.
9. **Palette per ruoli:** World, Panel 1/2, Ink, Dim, Enemy/Attack, Defense,
   Money, Paper. I pigmenti possono cambiare, i ruoli no.
10. **Asset:** i file V3 nascono come sibling `*-v3.png`; il V2 resta come
    fallback finché la sostituzione non è verificata nel gioco.

## 3. Decisioni di layout

### D-01 — Modello del viewport · **deciso: B, layout adattivo** (2026-09-18)

Scartata l'opzione A (stage fisso 640×360 con scala intera e letterbox):
con molto testo italiano e gioco su telefono in verticale diventerebbe
illeggibile.

Regole:

1. **Il layout si riorganizza, i pixel no.** Pannelli e zone si dispongono con
   CSS grid e container query; sprite, ticket e icone si mostrano solo a scala
   intera (`image-rendering: pixelated`).
2. **Griglia a 8 px** per spaziature, bordi e dimensioni dei pannelli.
3. **Vietato `transform: scale()`** su scene, pannelli e canvas grattabili.
   Ammesso solo in animazioni brevi di feedback che non spostano la geometria.
4. **Breakpoint della shell:**

   | Nome | Larghezza | Disposizione |
   |---|---|---|
   | compact | < 600 px | HUD compresso simbolo+valore, stage, rail inferiore; log in drawer |
   | medium | 600–1023 px | HUD completo, stage, rail inferiore |
   | wide | ≥ 1024 px | HUD completo, stage, rail laterale; log sempre visibile |

5. **Niente scroll verticale della pagina** nelle schermate di gioco: se il
   contenuto non entra, scrolla il pannello interno, non la scena.
6. Vale per ogni schermata: 01-SHELL-HUD e 04-COMBAT la adottano già; il
   vincolo 640×360 dei documenti in archivio non è più in vigore.
7. **Priorità desktop** (2026-09-18): si costruisce e rifinisce solo *wide*.
   *medium* e *compact* restano nel disegno delle zone ma si implementano più
   avanti; nel frattempo sotto i 1024 px basta che nulla si rompa (niente
   scroll orizzontale, CTA raggiungibili).

### D-02 — Dimensione nativa dei ticket · **deciso: 320×240**

Con il layout B il ticket deve entrare a ×1 nella colonna di un telefono
(390 px − 2×16 px di margine = 358 px). 384×288 non entra; 320×240 sì.

| Contesto | Scala | Dimensione a schermo |
|---|---:|---:|
| compact | ×1 | 320×240 |
| medium / wide | ×2 | 640×480 |
| schermi grandi, se entra per intero | ×3 | 960×720 |

Le miniature derivano dallo stesso master. La bible passa da
"320×240 o 384×288" a 320×240.

### D-03 — Mappa · direzione in definizione (2026-09-18)

- orientamento **orizzontale**: partenza a sinistra, boss a destra, atto intero
  visibile senza scroll;
- estetica **slot da tabacchi "trash"** tradotta in pixel art (cornici oro a
  gradini, simboli saturi, numeri di payline, scritte JACKPOT/BONUS), senza
  gradienti morbidi né glow;
- **patina argentata solo sui nodi segreti**; il resto resta leggibile;
- **pedina** sulla mappa che avanza a scatti; non è il dito (si confonderebbe
  col cursore).

## 4. Idee di gameplay (fuori dal redesign)

Richiedono bilanciamento e commit separati; il redesign prepara solo la sede.

Elenco completo e dettagli in [FEATURE-BACKLOG.md](FEATURE-BACKLOG.md).

- **G-01 Pedine collezionabili — DA FARE, PRIORITÀ ALTA.** La pedina della
  mappa è un oggetto: si compra o si trova, un nuovo NPC le spaccia, e quella
  equipaggiata modifica il gioco. Il redesign mappa mostra una pedina base e
  lascia pronto lo slot.

## 4b. Stato delle schermate

Legenda: ✅ fatto e verificato · 🟡 parziale · ⬜ non iniziato.
"Fatto" = [Definition of done](#6-definition-of-done) completa.

| # | Schermata | Stato | Note |
|---|---|:---:|---|
| 01 | Shell e HUD | 🟡 | desktop fatto (barra, rail unghie modulare, scontrino, ticker); aperti combat, zaino shop, finali, tablet/telefono — vedi 01-SHELL-HUD |
| 02 | Titolo | ✅ | `TitleScreen.jsx`, verificato desktop, 390×844, 375×667 |
| 02 | Tutorial unghie (3 pagine) | ⬜ | ancora nella UI legacy |
| 03 | Mappa | ⬜ | |
| 04 | Combat | ⬜ | pilot revertito; piano valido in [04-COMBAT.md](redesign/04-COMBAT.md) |
| 05 | Overlay grattata e ticket | 🟡 | artwork V3 per le 17 famiglie integrato, ma non conforme alla bible (vedi §5) |
| 06 | Dita, unghie, strumenti | 🟡 | 5 stati su 9 |
| 07 | Shop e inventario | ⬜ | |
| 08 | Eventi e dialoghi | ⬜ | |
| 09 | Locanda, cella, minigiochi | ⬜ | |
| 10 | Finali e meta | ⬜ | |
| — | Regressione di una run completa e audit finale | ⬜ | |

## 5. Stato degli asset

Dettaglio in [V3-ASSET-RECREATION-MANIFEST.md](V3-ASSET-RECREATION-MANIFEST.md).

| Famiglia | Totale | V3 integrati | Conformi alla bible |
|---|---:|---:|---:|
| Ticket completi | 17 | 17 | 0 — sono 364×273 (D-02 fissa 320×240) e ridotti da raster, non disegnati nativi |
| Miniature ticket | 17 | 17 | 0 — derivate dai ticket sopra |
| Stati unghia | 9 | 5 | da verificare |
| Cursori dito | 9 | 5 | da verificare |
| Cursori oggetto | 15 | 0 | — |
| Personaggi | 24 | 1 (Tabaccaio 64×96, nello shop) | da verificare |
| Oggetti | 40 | 0 | — |
| HUD | 9 | 0 | — |
| Categorie combat | 3 | 0 | — |
| Scene e room | 16 | 0 | — |

Dimensione nativa dei ticket fissata a 320×240 (D-02): i 17 ticket vanno
ridisegnati a quella misura.

## 6. Definition of done

Una schermata è ✅ solo se:

1. tutti gli stati sono elencati nel suo documento `redesign/NN-*.md`;
2. il wireframe è approvato prima dell'implementazione;
3. contenuti e gimmick originali sono tutti presenti;
4. mouse, tastiera e touch funzionano;
5. nessun residuo legacy involontario (shell, HUD, cornici doppie);
6. simboli e azioni leggibili senza colore;
7. screenshot a 1280×720, 1366×768 e 1920×1080 confrontati insieme; più un
   controllo a 390×844 che non ci siano rotture (non rifinitura);
8. build superata e controllo visivo sulla schermata intera nel gioco reale.

## 7. Ordine di lavoro

1. ~~D-01 viewport + D-02 dimensione ticket~~ — fatto.
2. ~~COPY-001~~ — fatto.
3. **Shell e HUD** (01): una sola macchina scenica proprietaria del viewport.
4. **Combat** (04), sulla nuova shell.
5. **Ticket** (05): rifacimento nativo, pilota Fortuna Flash, poi batch da quattro.
6. **Dita e unghie** (06): i 4 stati mancanti e i 15 cursori oggetto.
7. **Mappa** (03).
8. **Tutorial** (02), **Shop** (07), **Eventi** (08), **Locanda** (09).
9. **Finali e meta** (10); personaggi principali per ultimi.
10. Regressione di una run completa.

## 8. Mappa dei documenti

| Documento | Ruolo |
|---|---|
| `STATUS.md` | stato, decisioni e ordine — **questo file** |
| [VISUAL-DIRECTION-DECISION.md](VISUAL-DIRECTION-DECISION.md) | direzione e principi di interazione approvati |
| [redesign/00-MASTER-PLAN.md](redesign/00-MASTER-PLAN.md) | concept, architettura comune, regole |
| `redesign/01…10` | un documento per schermata: stati, direzione, gate |
| [redesign/11-PIXEL-ART-BIBLE.md](redesign/11-PIXEL-ART-BIBLE.md) | standard tecnico degli asset |
| [V3-ASSET-RECREATION-MANIFEST.md](V3-ASSET-RECREATION-MANIFEST.md) | elenco completo dei 163 asset |
| [PRESENTATION-LAYER-MAP.md](PRESENTATION-LAYER-MAP.md) | dove vive il codice di presentazione |
| [BUG-REGISTER.md](BUG-REGISTER.md) | bug funzionali, separati dal redesign |
| [FEATURE-BACKLOG.md](FEATURE-BACKLOG.md) | nuove meccaniche di gameplay da progettare (G-01 pedine) |
| [archive/](archive/) | fasi concluse e decisioni superate |
