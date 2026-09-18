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

## 3. Decisione aperta che blocca tutto il resto

### D-01 — Modello del viewport

I documenti precedenti si contraddicevano:

| Opzione | Descrizione | Chi la sosteneva |
|---|---|---|
| **A. Risoluzione fissa** | stage logico 640×360, scala intera ×1/×2/×3, letterbox | Visual System v1, Phase 0 |
| **B. Layout adattivo** | griglia CSS/container query, pannelli che si riorganizzano, niente `transform: scale()` | 01-SHELL-HUD, 04-COMBAT |

Stato del codice: **nessuna delle due**. Oggi ci sono `maxWidth` + `vw`,
`overflowY: auto` e `transform: scale()` in sei componenti più `animations.js`.

**Raccomandazione: B con griglia a 8 px.** Il gioco ha molto testo italiano e va
giocato anche su telefono in verticale (390×844): un 640×360 fisso diventerebbe
illeggibile. La disciplina pixel si ottiene così: sprite e ticket a scala intera
dentro pannelli adattivi; il layout si riorganizza, i pixel non si deformano.

Fino a questa decisione non si inizia la shell.

## 4. Stato delle schermate

Legenda: ✅ fatto e verificato · 🟡 parziale · ⬜ non iniziato.
"Fatto" = [Definition of done](#6-definition-of-done) completa.

| # | Schermata | Stato | Note |
|---|---|:---:|---|
| 01 | Shell e HUD | ⬜ | **prossima**, dopo D-01. Causa del problema "pannello incollato" su tutte le schermate |
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
| Ticket completi | 17 | 17 | 0 — sono 364×273 (la bible chiede 320×240 o 384×288) e ridotti da raster, non disegnati nativi |
| Miniature ticket | 17 | 17 | 0 — derivate dai ticket sopra |
| Stati unghia | 9 | 5 | da verificare |
| Cursori dito | 9 | 5 | da verificare |
| Cursori oggetto | 15 | 0 | — |
| Personaggi | 24 | 1 (Tabaccaio 64×96, nello shop) | da verificare |
| Oggetti | 40 | 0 | — |
| HUD | 9 | 0 | — |
| Categorie combat | 3 | 0 | — |
| Scene e room | 16 | 0 | — |

**Da decidere con la D-01:** la dimensione nativa unica dei ticket. Senza,
rifare i 17 ticket adesso significherebbe rifarli due volte.

## 6. Definition of done

Una schermata è ✅ solo se:

1. tutti gli stati sono elencati nel suo documento `redesign/NN-*.md`;
2. il wireframe è approvato prima dell'implementazione;
3. contenuti e gimmick originali sono tutti presenti;
4. mouse, tastiera e touch funzionano;
5. nessun residuo legacy involontario (shell, HUD, cornici doppie);
6. simboli e azioni leggibili senza colore;
7. screenshot a 1366×768, 768×1024, 390×844 e 375×667 confrontati insieme;
8. build superata e controllo visivo sulla schermata intera nel gioco reale.

## 7. Ordine di lavoro

1. **D-01** viewport + dimensione nativa ticket.
2. **COPY-001**: correzione di una riga di testo, indipendente dal redesign.
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
| [archive/](archive/) | fasi concluse e decisioni superate |
