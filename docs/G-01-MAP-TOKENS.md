# G-01 — Gettoni del Destino (pedine della mappa)

Stato: **APPROVATO · fasi 2–4 fatte, prossima la 5 (regali NPC)** · 2026-09-19 · sostituisce la sezione "Da progettare"
di G-01 in `FEATURE-BACKLOG.md`.

La pedina che avanza sulla mappa è un gettone. Quello equipaggiato cambia il modo
di attraversare i nodi. Ogni gettone ha sempre tre cose, scritte sulla scheda:

- **VANTAGGIO**: cosa ci guadagni;
- **FREGATURA**: il prezzo, coerente col tema del gettone;
- **QUANDO**: la condizione che lo fa scattare, in una riga.

Alcuni gettoni sono volutamente **inutili o assurdi**: non danno niente di
misurabile, ma cambiano un suono, una scritta o un comportamento della pedina.
Sono la parte collezionabile e divertente, e costano poco.

> Terminologia. Sullo schermo la mappa è orizzontale e si parla di **colonne**.
> Nel codice (`src/utils/map.js`) le stesse cose si chiamano `row` (0 = partenza,
> 10 = boss). In questo documento "colonna N" = `row N`.

---

## 1. Regole

| Regola | Valore |
|---|---|
| Pedine equipaggiate | **1** alla volta |
| Custodia | **3 posti**, dentro lo zaino, sezione `GETTONI n/3` |
| Gettone d'Ottone | parte in custodia, **occupa uno dei 3 posti** e si può buttare come gli altri |
| Custodia mai vuota | non puoi buttare l'ultimo gettone; se un effetto te lo toglie (sequestro), torna l'Ottone |
| Buttare quello equipaggiato | si equipaggia il primo rimasto in custodia |
| Custodia piena | scelta obbligatoria: `EQUIPAGGIA` · `CONSERVA` (butti uno) · `SCAMBIA` · `RIFIUTA` |
| Cambio pedina | solo sulla mappa, **prima** di scegliere il nodo |
| Dopo la scelta del nodo | gettone bloccato fino al ritorno sulla mappa |
| Durata | solo la run corrente |
| Metagame | si salva solo il **catalogo** dei gettoni scoperti (vetrina, niente effetti) |
| Inizio run | custodia con il solo Gettone d'Ottone, equipaggiato |
| Più gettoni insieme | **mai**: conta solo quello equipaggiato |
| Duplicati | convertiti subito in denaro (tabella §4) |

Buttare un gettone è definitivo per la run (torna ottenibile dal Pedinaro).

Questo separa i gettoni dagli altri sistemi: le **reliquie** sono passive e
permanenti nella run, i **grattatori** e gli **oggetti** si consumano, la
**Fortuna** è una risorsa a turni. Il gettone è una scelta di *stile di
percorso* che puoi cambiare tra un nodo e l'altro.

---

## 2. Catalogo

Rarità: **Base** · **Comune** · **Raro** · **Maledetto** (forte, con fregatura
pesante) · **Cianfrusaglia** (assurdo o inutile).

"Nodo pericoloso" = `ladro`, `miniboss`, `spacciatore`, `poliziotto`
(la zona sinistra della mappa). "Nodo sicuro" = `locanda`, `tabaccaio`,
`mendicante`, `sacerdote`, `chirurgo`.

### 2.1 Base

| Gettone | Vantaggio | Fregatura | Quando |
|---|---|---|---|
| **Gettone d'Ottone** | Pedina base | Nessuna | Sempre |

### 2.2 Comuni

| Gettone | Vantaggio | Fregatura | Quando |
|---|---|---|---|
| **Fiche Blu** | Tabaccai −10% | Ricompense dei combattimenti −10% | Tabaccaio / fine combattimento |
| **Moneta del Vicolo** | +€8 dopo un nodo pericoloso vinto | Locanda +€5 | Vittoria su nodo pericoloso / locanda |
| **Biglia del Bambino** | Il primo evento del bioma offre anche un grattino base | Se hai ≥5 biglietti, ne perdi uno casuale entrando nel bioma | Primo evento / ingresso bioma |
| **Gettone del Telefono** | 1 volta per bioma: rivela il tipo di un nodo nascosto a scelta | Ogni uso costa €1; 1 su 5 "numero sbagliato", la carica si consuma senza rivelare | Attivo, dalla mappa |
| **Pedina Magnetica** | +€1 per ogni nodo attraversato | Probabilità di Poliziotto raddoppiata (7% → 14%) nelle mappe generate *dopo* averla equipaggiata | Ogni nodo / generazione mappa |
| **Sassolino** | I furti ti tolgono metà | La locanda cura il 10% in meno ("il letto scricchiola") | Furto / locanda |

### 2.3 Rari

| Gettone | Vantaggio | Fregatura | Quando |
|---|---|---|---|
| **Dado Scheggiato** | 1 volta per bioma apre un percorso alternativo: un nodo raggiungibile in più nella colonna successiva | Il nodo scelto così diventa **élite** | Attivo, dalla mappa, colonne 1–7 |
| **Santino Plastificato** | Annulla una multa, un furto o una maledizione (1 carica per bioma) | −1 Fortuna per i 3 nodi successivi | Automatico al primo evento negativo |
| **Fiche Truccata** | Soglia dei nodi segreti −1 (Fortuna 2 → 1) | Tabaccaio +15% | Mappa / tabaccaio |
| **Mezzo Corno** | +1 Fortuna nei nodi di colonna pari | −1 Fortuna nei nodi di colonna dispari | Ingresso nodo |
| **Dente d'Oro** | Chirurgo e Macellaio −20% | Ogni combattimento perso: −€5 extra | Chirurgo / sconfitta |
| **Gettone dell'Autoscontro** | Scegliendo un nodo pericoloso, 25% di "rimbalzare" su un nodo adiacente della stessa colonna | Il rimbalzo è casuale: puoi finire in un posto peggiore | Scelta di nodo pericoloso |
| **Testa o Croce** | A ogni tabaccaio: 50% prezzi −20% | Altrimenti prezzi +20% | Ingresso tabaccaio |

### 2.4 Maledetti

| Gettone | Vantaggio | Fregatura | Quando |
|---|---|---|---|
| **Gettone Nero** | Nodi élite: ricompense ×1,5 (sopra l'×2 élite già esistente) | Alla generazione della mappa, fino a 2 nodi pericolosi in più diventano élite | Élite / generazione mappa |
| **Gettone Contraffatto** | Vale il triplo come merce di baratto dal Pedinaro | Se incontri il Poliziotto con questo equipaggiato: sequestro + multa €20 | Pedinaro / Poliziotto |
| **Moneta Incollata** | +1 Fortuna fissa finché è equipaggiata | Non si può togliere per 3 nodi dopo averla equipaggiata | Sempre |
| **Pedina del Debito** | +€30 subito quando la equipaggi la prima volta | Ogni ingresso in locanda: −€10 finché resta in custodia (anche non equipaggiata) | Prima equipaggiata / locanda |

### 2.5 Stravaganti (strani ma utili)

Rarità `cianfrusaglia` nel codice, etichetta **Stravagante**. Regola del
proprietario (2026-09-19): **niente gettoni inutili**. Tolti Tappo "Ritenta",
Fiche Bucata e Chiave di Casa: ogni gettone deve servire a qualcosa.

| Gettone | Vantaggio | Fregatura | Quando |
|---|---|---|---|
| **Lira del '99** | Al tabaccaio, 5% che la accettino come €20 | Altrimenti, 1 volta per bioma, −1 Fortuna per l'umiliazione | Ingresso tabaccaio |
| **Pedina Invisibile** | I Ladri hanno il 15% di non vederti. *Visivo: la pedina è trasparente* | Anche il tabaccaio non ti vede: niente sconti da altre fonti | Ladro / tabaccaio |
| **Sorpresina** | Al primo boss battuto si apre e diventa un gettone Comune o Raro non posseduto | Finché è chiusa occupa un posto e basta | Boss battuto |
| **Ferro da Stiro** | Ogni 5 nodi senza combattere: "ritira €20" | La pazienza | Contatore nodi |
| **Tappo di Spumante** | Primo nodo di ogni bioma: coriandoli e +€10. *Visivo* | Il botto attira gente: un Ladro in più sulla mappa del bioma | Ingresso bioma |
| **Gettone del Flipper** | Tre nodi dello stesso tipo di fila: +€15 | Quattro di fila: TILT, effetti spenti per 1 nodo | Contatore tipi |

### 2.6 Visivi (cambiano come vedi il gioco, e servono)

Direzione del proprietario (2026-09-19): effetti fini "da vetrina", niente
filtri grossolani a schermo intero. Tolti Occhiali 3D e Fiche Psichedelica
(non piacevano), Noir e Zecchino sostituiti. L'effetto dura finché il
gettone è la pedina; ricette in `src/components/tokens/tokenVisuals.js`.

| Gettone | Vantaggio | Fregatura | Effetto visivo |
|---|---|---|---|
| **Gettone di Madreperla** (raro) | Vincite dei grattini +15% | Luccichi: un Ladro in più sulla mappa di ogni bioma | *Pearlescent UI + spectral shimmer*: luccichio perlato che segue il cursore, bordo iridescente che si accende quando ti muovi |
| **Prisma di Cristallo** (comune) | Vedi cosa c'è nei nodi segreti anche senza Fortuna | Fragile: dopo una sconfitta si spegne per 2 nodi | *Chromatic refraction*: separazione RGB solo ai bordi, come vetro |
| **Pellicola 35mm** (comune) | Premi contro Ladri e Spacciatori +20% | −€3 a ogni combattimento | *Halation + selective bloom + film grain*: alone caldo solo sulle luci, grana fine |
| **Gettone dell'Umore** (comune) | Unghie sofferenti → locanda −20% | Più di €100 → tabaccaio +10% | *Palette morphing*: colori più caldi coi soldi, più freddi col dolore |
| **Gettone Aura** (raro) | Vincita ≥ €20: +1 Fortuna per 2 nodi | Sconfitta: −1 Fortuna per 2 nodi | *Reactive aura*: bordo che respira, oro quando entrano soldi, rosso quando escono |
| **Retino Tipografico** (comune) | Grattini −10% | Premi massimi dei grattini −10% | *Animated dithering*: colori a livelli + retino di stampa che vibra |
| **Goccia di Mercurio** (maledetto) | Il primo colpo subito in ogni combattimento scivola via | Ogni 5 nodi un'unghia peggiora | *Liquid lens* a ogni cambio di schermata |
| **Gettone VHS** (raro) | 1 volta per bioma rigiochi un combattimento perso | €10 per riavvolgere | Nastro: righe, tracking, PLAY ► / ● REC |
| **Specchietto del Barbiere** (comune) | Tabaccai −15% | Mappa al contrario | Mappa specchiata (scritte leggibili) |

### 2.6bis Ritocchi per tutto il gioco (non gettoni)

- **Soft film grain**: la grana CRT esistente (`body::after`, index.html) è
  diventata più fine e organica, luce e ombra, quasi impercettibile.
- ~~Dissolvenza a retino tra le schermate~~: tolta il 2026-09-19, al
  proprietario non piace la transizione pixel che passa dal nero. Il
  dithering animato resta solo nel Retino Tipografico.
- **Liquid lens su impatti e power-up**: onda breve (filtro SVG, 0,55 s) quando
  suonano colpi, parate, unghie rotte, dolore, ingresso boss, cure, vincite,
  jackpot, trofei e gettoni. Parte da `utils/fx.js` (`emitFx`), chiamato dai
  suoni semantici di `audio.js`. Il filtro è attivo solo mentre l'onda corre.
- Con "riduci movimento" la lente liquida non parte.

Etichette (`TOKEN_TAGS` in `data/tokens.js`): **utile** (cambia soldi,
fortuna o percorso), **simpatico** (ha una trovata), **visivo** (cambia come
vedi il gioco). Tutti i gettoni tranne l'Ottone devono essere "utile".

**Totale: 33 gettoni** (1 base, 11 comuni, 10 rari, 5 maledetti, 6
stravaganti; 11 hanno un effetto visivo).

### 2.7 Modalità debug

In sviluppo (o con `?debug` nell'URL) in basso a sinistra c'è **DEBUG
GETTONI**: catalogo grafico di tutti i gettoni con filtri (utili, simpatici,
visivi, in gioco, da collegare), anteprima di ogni effetto visivo,
**PROVA SUL GIOCO** (applica l'effetto allo schermo) e **DAI ALLA RUN**.
Da console: `window.__gettoni.catalog()`.

> Nomi cambiati rispetto alla proposta: **Bottone del Bambino → Biglia del
> Bambino** (esiste già il grattatore `bottone`), e il vecchio "Cornetto rosso"
> del backlog diventa **Mezzo Corno** (esiste già la reliquia `cornetto`). Il
> **Dado Scheggiato** resta: la reliquia `dadoTruccato` ha nome e sprite diversi.

---

## 3. Il Pedinaro

NPC nuovo, nodo proprio (`type: "pedinaro"`), **uno per bioma**.

**Posizione.** Colonne 4–7, su un nodo con almeno 2 archi in entrata, mai
sopra Guantaio, tabaccai/locande garantiti, nodi segreti, élite o Vecchio. Un
solo nodo non è raggiungibile da tutti i percorsi: per questo esiste la
compensazione.

**Offerta a ogni visita.**

- 2 gettoni casuali non posseduti, pescati per rarità (Comune 55% · Raro 25% ·
  Maledetto 8% · Cianfrusaglia 12%);
- uno **in vendita**, l'altro **in baratto** (dai un gettone della custodia o
  2 grattini usati);
- alla prima visita della run: dialogo tutorial e, se hai solo l'Ottone,
  scelta gratuita tra i due.

**Compensazione.** Se esci dalla colonna 7 senza aver ottenuto nessun gettone
nel bioma, il boss offre in più la scelta tra 2 gettoni Comuni.

### Prezzi e rivendita

| Rarità | Prezzo dal Pedinaro | Duplicato → denaro |
|---|---|---|
| Cianfrusaglia | €5 | €2 |
| Comune | €25 | €8 |
| Raro | €45 | €15 |
| Maledetto | €60 | €20 |

Riferimento: locanda €5–50, soglie boss €200–700. Un gettone raro costa quanto
una notte buona in locanda.

---

## 4. Altre fonti

I regali degli NPC sono **esempi di partenza**; se ne aggiungono altri dopo il
primo playtest. Ogni regalo è registrato per NPC e bioma: non si ripete.

| Fonte | Gettone | Condizione |
|---|---|---|
| Sacerdote | Santino Plastificato | Donazione ≥ €30 |
| Bambino | Biglia del Bambino | Scambio di 2 grattini usati |
| Spacciatore | Gettone Nero | Accetti l'affare rischioso |
| Poliziotto | Fiche Blu ("prova sequestrata") | Superi il controllo senza multa |
| Vecchio | Dado Scheggiato | Terzo incontro nella run |
| Streamer | Gettone VHS | La chat ti regala una cassetta |
| Anziana | Moneta Incollata | Accetti la sua benedizione |
| Zaino abbandonato | Cianfrusaglia casuale | 20% del loot |
| Boss | 30%: scelta tra un gettone non posseduto e una reliquia | Vittoria |

---

## 5. Interfaccia

**Mappa**

- la pedina usa lo sprite del gettone equipaggiato (32×32);
- clic sulla pedina → scheda con VANTAGGIO / FREGATURA / QUANDO e cariche;
- pulsante `CAMBIA GETTONE` (solo prima della scelta del nodo);
- i gettoni con potere attivo (Dado, Telefono) mostrano un pulsante accanto
  alla legenda, con le cariche rimaste;
- anteprima del percorso modificato (Dado) prima della conferma.

**Zaino**

- terza sezione `GETTONI n/3`, separata da reliquie e grattatori;
- placca `PEDINA ATTIVA` sul gettone equipaggiato (sprite 48×48);
- animazione e suono di moneta inserita nella slot al cambio;
- con custodia piena, modale obbligatoria `EQUIPAGGIA / CONSERVA / SCAMBIA / RIFIUTA`.

**Metagame**: vetrina "Collezione Gettoni" con sagome nere per quelli non ancora
scoperti.

---

## 6. Protezioni contro gli exploit

- **Fotografia**: alla scelta del nodo si salva `node.tokenSnapshot` (id del
  gettone). Tutti gli effetti di quel nodo leggono la fotografia, mai il
  gettone corrente.
- Nessun cambio dopo aver visto l'evento o il nodo.
- Cariche salvate per bioma (`charges[biome][tokenId]`), non si ripristinano
  cambiando gettone o ricaricando.
- **Tetti globali**, applicati in un solo punto: sconto totale sui prezzi
  massimo **35%**, bonus denaro totale massimo **+50%**, soglia segreti mai
  sotto 1.
- Regali NPC registrati come `"<npc>@<bioma>"`.
- Nessun gettone tocca la soglia d'ingresso del boss, salvo scritto
  esplicitamente.
- Il Dado non salta righe: aggiunge un arco verso un nodo della colonna
  successiva. Mai verso il boss né verso la colonna 9 se ne rompe la
  convergenza.
- Tutti gli effetti passano da un modulo centrale: niente `if (token === ...)`
  sparsi nei componenti.

---

## 7. Modello dati

```js
// src/data/tokens.js — catalogo, solo dati
export const TOKENS = {
  ottone:   { name: "Gettone d'Ottone", rarity: "base", pro: "…", contro: "…", quando: "…" },
  ficheBlu: { name: "Fiche Blu", rarity: "comune",
              mods: { shopPrice: -0.10, combatReward: -0.10 } },
  // …
};

// stato della run
player.tokens = {
  equipped: "ottone",
  pouch: ["ottone"],       // max 3 id, Ottone compreso
  charges: {},             // { [biomeIdx]: { dado: 0, telefono: 1 } }
  npcGifts: {},            // { "sacerdote@0": true }
  counters: {},            // Ferro da Stiro, Flipper, Moneta Incollata…
};

// meta (useMeta)
meta.tokenCatalog = ["ottone", …];
```

```js
// src/utils/tokens.js — unico punto di applicazione
tokenMod(state, "shopPrice", ctx)      // → moltiplicatore, già limitato dai tetti
tokenMod(state, "combatReward", ctx)
tokenHook(state, "onNodeResolved", ctx) // → { money, fortune, log[] }
tokenHook(state, "onMapGenerated", map)
tokenHook(state, "onNegativeEvent", ev) // Santino
canSwapToken(state)                     // false dopo la scelta del nodo
acquireToken(state, id)                 // gestisce custodia piena e duplicati
```

Test con `node --test` (nessuna dipendenza nuova): tetti, fotografia, cariche,
custodia piena, duplicati, validità del grafo dopo il Dado su migliaia di mappe.

---

## 8. Piano di sviluppo

| Fase | Contenuto | Fatto quando |
|---|---|---|
| 1 | Questo documento approvato | Numeri confermati dal proprietario |
| 2 | `tokens.js` dati + logica + test, senza UI | Test verdi, nessun cambio visibile al gioco |
| 3 | Custodia, cambio pedina, primi 4 gettoni: **Ottone, Fiche Blu, Moneta del Vicolo, Tappo "Ritenta"** | Giocabile da inizio a fine run |
| 4 | Pedinaro, acquisizione, duplicati, compensazione | Un gettone ottenibile in ogni bioma |
| 5 | Altri 4 (Santino, Dado, Fiche Truccata, Gettone Nero) + regali NPC | 8 gettoni in gioco |
| 6 | Resto del catalogo, sprite pixel-art (bible `redesign/11`), audio metallico, animazioni | 33 gettoni con sprite e suono |
| 7 | Simulazione di migliaia di mappe: percorsi validi, economia entro i tetti | Nessuna mappa bloccata, nessun tetto superato |

Primo rilascio con 4 gettoni: 2 economici, 1 base, 1 cianfrusaglia per provare
subito il tono assurdo. Si estende a 8 dopo il playtest.

---

## 8bis. Avanzamento

**Fase 2 — fatta.** `src/data/tokens.js` (catalogo), `src/utils/tokens.js`
(unica logica), `tests/tokens.test.js` (`npm test`).

**Fase 3 — fatta.** Gettoni in gioco: `TOKEN_RELEASE` = Ottone, Fiche Blu,
Moneta del Vicolo (il Tappo "Ritenta" è stato tolto: inutile).

- Stato della run in `player.tokens`; catalogo scoperto in localStorage
  (`grattini_tokens_discovered`).
- Mappa desktop: la pedina ha la faccia del gettone; clic → scheda con
  CAMBIA / BUTTA; pedina attiva cliccabile in legenda; "RITENTA" nei tooltip
  (anche sulla mappa mobile).
- Zaino: tasca `GETTONI n/3` in sola lettura, con VANTAGGIO / FREGATURA per
  esteso e la regola scritta: la pedina si cambia **solo sulla mappa**
  (clic sulla pedina → CAMBIA GETTONE), mai dallo zaino.
- Custodia piena: modale EQUIPAGGIA / CONSERVA / SCAMBIA / RIFIUTA.
- Effetti collegati: prezzi tabaccaio (con tetto), premi dei combattimenti
  (sopra l'×2 élite), costo locanda, +€ di fine nodo, fotografia alla scelta
  del nodo e sblocco al ritorno sulla mappa.
- Fonti provvisorie finché non c'è il Pedinaro: zaino abbandonato (20% se c'è
  un gettone non posseduto) e compensazione del boss (un gettone a caso; la
  scelta tra due arriva con la fase 4).
- Suono `AudioEngine.tokenInsert` (moneta nella slot).
- Solo in sviluppo: `window.__gettoni.grant("ficheBlu")` per il playtest.

Fatto anche: vetrina del catalogo nella home (Archivio → **Pedine**) e capitolo
IV del tutorial dedicato alla pedina.

Non ancora: pedina cliccabile sulla mappa mobile (oggi lì non si cambia),
sprite pixel-art (fase 6).

## 8quater. Fase 4 — il Pedinaro (2026-09-19)

- **Mappa**: un nodo `pedinaro` per bioma, colonne 4–7, su un nodo con
  almeno 2 strade in entrata, mai sopra Guantaio, tabaccai/locande,
  Sacerdote, segreti, élite o Vecchio (`utils/map.js`). Verificato su 2000
  mappe: sempre esattamente uno. Famiglia "sicuro" sulla legenda.
- **Bottega** (`components/tokens/PedinaroDesk.jsx`): stesso stile della
  scena di Nonno Carmelo. Due gettoni per visita, tirati una volta:
  **in vendita** (prezzo per rarità) e **in baratto** (un tuo gettone che valga
  almeno il 60%, mai l'Ottone né la pedina addosso — oppure 2 biglietti, i meno
  cari). Il Contraffatto vale il triplo nel baratto.
- **Prima visita** della run con il solo Ottone: uno dei due è **in regalo**.
- Si paga **solo quando il gettone entra**: con la custodia piena, RIFIUTA
  non costa niente.
- **Compensazione**: se esci da un bioma senza aver preso gettoni, il boss ne
  lascia due comuni e ne **scegli uno** (`TokenChoiceModal`). Non dopo il boss
  finale.
- **Tutti i 33 gettoni sono ora ottenibili** (`TOKEN_RELEASE`).
- Dev: `window.__gettoni.pedinaro()` apre la bottega.

## 8ter. Verifica effetti (2026-09-19)

Audit su richiesta del proprietario: prima di questo giro solo 5 agganci
erano chiamati dal gioco (prezzi del tabaccaio, premi dei combattimenti,
locanda, fine nodo, cambio pedina). Tutti gli altri effetti esistevano solo
nella logica. Ora **ogni vantaggio e ogni fregatura dei 33 gettoni è
collegato al gioco**, con una sola eccezione: il baratto del Gettone
Contraffatto, che richiede il Pedinaro (fase 4). La sua fregatura (sequestro
dal Poliziotto) funziona già.

Controlli automatici (`npm test`):

- `tests/token-effects.test.js`: per **ogni** gettone un test del VANTAGGIO
  e uno della FREGATURA; fallisce se si aggiunge un gettone senza verifica.
- Stesso file: controllo che ogni aggancio (`fortuneModifier`,
  `scratchPrize`, `onNegativeEvent`, `rewindCombat`…) sia davvero chiamato
  dal file del gioco giusto.

Dove si aggancia ogni effetto:

| Effetto | Punto del gioco |
|---|---|
| Fortuna (Mezzo Corno, Incollata, Prisma, Aura, Santino) | `useNailHandlers` → Fortuna effettiva |
| Nodi segreti (Fiche Truccata, Telefono) | `MapBoard`, `MapView` |
| Prezzi tabaccaio, grattini (Retino), Umore | `utils/shop.js` |
| Chirurgo e Macellaio (Dente d'Oro) | `surgeonPrice` in `EventView` e `useEventHandlers` |
| Locanda: costo e cure (Vicolo, Debito, Umore, Sassolino) | `locandaRoom` in `LocandaView` |
| Premi combattimento (Fiche Blu, Nero, Pellicola) | `useNodeHandlers.handleCombatEnd` |
| Vincite grattini (Madreperla, Retino, Aura) | `useScratchHandlers` |
| Fine nodo (Vicolo, Magnetica, Dente d'Oro, Ferro, Flipper, Pellicola, Spumante, Mercurio) | `onNodeResolved` in `scratchlite` |
| Ingresso nodo (Invisibile, Contraffatto, Lira, Biglia) | `useNodeHandlers.enterNode` |
| Scelta nodo (Autoscontro, Testa o Croce) | `useNodeHandlers.selectNode` |
| Multe, furti, maledizioni (Santino, Sassolino) | `useEventHandlers`, locanda |
| Combattimento (Mercurio primo colpo, Sassolino furti, VHS riavvolgi) | `CombatView` (`tokenCombat`), `handleCombatEnd` |
| Nuove mappe (Magnetica, Nero, Madreperla, Spumante) | `makeMap` → `generateMap` + `onMapGenerated` |
| Boss e nuovo bioma (Sorpresina, Biglia, compensazione) | `handleCombatEnd` |
| Poteri attivi (Telefono, Dado) | scheda della pedina sulla mappa |

Testi corretti perché non avevano senso in gioco: **Telefono** (i segreti
sono sempre eventi → ora *apre* il segreto più vicino), **Prisma** (ora +1
Fortuna nei nodi evento), **Sassolino** (la locanda cura unghie intere → ora
1 unghia in meno), **Retino** (−10% quando esce il premio massimo). Il
Telefono richiede almeno €1.

## 9. Decisioni prese (2026-09-19)

1. **Custodia**: l'Ottone occupa uno dei 3 posti e si può buttare.
2. **Pedinaro**: un nodo per bioma, più compensazione dal boss.
3. **Gettone Nero**: ×1,5 sopra l'×2 élite = ×3 totale (il +50% del gettone è
   esattamente il tetto).
4. Rarità al Pedinaro: Comune 55 · Raro 25 · Maledetto 8 · Cianfrusaglia 12.
   Se una rarità è esaurita, il suo peso si ridistribuisce sulle altre.

Nota di implementazione: la "fotografia" vive in `player.tokens.snapshot`
(`{ nodeId, tokenId, rolls }`), non sul nodo. I tiri casuali del nodo (Testa o
Croce, Autoscontro, Lira, Pedina Invisibile) si fanno **alla scelta del nodo**
e restano fissi: ricaricare non li ritira. I bonus in euro fissi (+€8, +€20…)
non passano dal tetto +50%, che vale per i moltiplicatori.
